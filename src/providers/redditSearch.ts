import type { RedditSignalItem } from "../types.js";

const REDDIT_TOKEN_URL = "https://www.reddit.com/api/v1/access_token";
const REDDIT_OAUTH_BASE_URL = "https://oauth.reddit.com";

type RedditListingChild = {
  data?: {
    title?: string;
    selftext?: string;
    permalink?: string;
    url?: string;
  };
};

type RedditListingResponse = {
  data?: {
    children?: RedditListingChild[];
  };
};

function toRedditTimeFilter(timeRange?: "7d" | "30d" | "90d"): "week" | "month" | "year" {
  if (timeRange === "7d") return "week";
  if (timeRange === "30d") return "month";
  return "year";
}

async function getRedditAccessToken(): Promise<string> {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  const userAgent = process.env.REDDIT_USER_AGENT;

  if (!clientId || !clientSecret || !userAgent) {
    throw new Error(
      "Missing Reddit credentials. Required: REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USER_AGENT."
    );
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(REDDIT_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": userAgent
    },
    body: "grant_type=client_credentials"
  });

  if (!response.ok) {
    throw new Error(`Reddit auth failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("Reddit auth failed: missing access token.");
  }

  return data.access_token;
}

export async function searchRedditSignals(params: {
  query: string;
  subreddits?: string[];
  timeRange?: "7d" | "30d" | "90d";
  maxPosts: number;
}): Promise<RedditSignalItem[]> {
  const userAgent = process.env.REDDIT_USER_AGENT;
  if (!userAgent) {
    throw new Error("Missing REDDIT_USER_AGENT.");
  }

  const token = await getRedditAccessToken();
  const timeFilter = toRedditTimeFilter(params.timeRange);
  const targets = params.subreddits?.length ? params.subreddits : [""];
  const perTargetLimit = Math.max(5, Math.ceil(params.maxPosts / targets.length));

  const allItems: RedditSignalItem[] = [];

  for (const subreddit of targets) {
    const basePath = subreddit ? `/r/${encodeURIComponent(subreddit)}/search` : "/search";
    const url = new URL(`${REDDIT_OAUTH_BASE_URL}${basePath}`);
    url.searchParams.set("q", params.query);
    url.searchParams.set("sort", "relevance");
    url.searchParams.set("t", timeFilter);
    url.searchParams.set("limit", String(perTargetLimit));
    url.searchParams.set("type", "link");
    url.searchParams.set("restrict_sr", subreddit ? "1" : "0");

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": userAgent
      }
    });

    if (!response.ok) {
      throw new Error(`Reddit search failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as RedditListingResponse;
    const children = data.data?.children ?? [];

    const mapped = children
      .map((child) => {
        const post = child.data;
        if (!post) return null;
        const permalink = post.permalink ? `https://www.reddit.com${post.permalink}` : "";
        const fallbackUrl = post.url ?? "";
        const finalUrl = permalink || fallbackUrl;
        if (!finalUrl) return null;

        return {
          title: (post.title ?? "Untitled").trim(),
          snippet: (post.selftext ?? "").trim().slice(0, 500),
          url: finalUrl
        } satisfies RedditSignalItem;
      })
      .filter((item): item is RedditSignalItem => Boolean(item?.url));

    allItems.push(...mapped);
  }

  const deduped = Array.from(new Map(allItems.map((item) => [item.url, item])).values());
  return deduped.slice(0, params.maxPosts);
}

