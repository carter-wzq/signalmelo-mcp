import { z } from "zod";
import { summarizeSignals } from "../providers/llm.js";
import { searchRedditSignals } from "../providers/redditSearch.js";
import type { AnalyzeOutput } from "../types.js";

const inputSchema = z.object({
  query: z.string().min(2),
  subreddits: z.array(z.string().min(1)).max(5).optional(),
  timeRange: z.enum(["7d", "30d", "90d"]).optional(),
  maxPosts: z.number().int().min(5).max(50).optional()
});

function fallbackOutput(sources: string[]): AnalyzeOutput {
  return {
    whatUsersLike: ["Not enough model output; see source links for raw signals."],
    whatUsersDontLike: ["Not enough model output; see source links for raw signals."],
    competitorsUsersMention: [],
    sources
  };
}

export async function analyzeRedditCommunitySignals(rawInput: unknown): Promise<AnalyzeOutput> {
  const parsedInput = inputSchema.parse(rawInput);
  const maxPosts = parsedInput.maxPosts ?? 30;

  const redditSignals = await searchRedditSignals({
    query: parsedInput.query,
    subreddits: parsedInput.subreddits,
    timeRange: parsedInput.timeRange,
    maxPosts
  });

  const sourceUrls = redditSignals.map((item) => item.url);
  if (redditSignals.length === 0) {
    return fallbackOutput([]);
  }

  try {
    const summary = await summarizeSignals({
      query: parsedInput.query,
      sources: redditSignals
    });
    return {
      whatUsersLike: summary.whatUsersLike,
      whatUsersDontLike: summary.whatUsersDontLike,
      competitorsUsersMention: summary.competitorsUsersMention,
      sources: summary.sources?.length ? summary.sources : sourceUrls
    };
  } catch {
    return fallbackOutput(sourceUrls);
  }
}

