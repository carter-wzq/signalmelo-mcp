export type RedditSignalItem = {
  title: string;
  snippet: string;
  url: string;
};

export type AnalyzeInput = {
  query: string;
  subreddits?: string[];
  timeRange?: "7d" | "30d" | "90d";
  maxPosts?: number;
};

export type AnalyzeOutput = {
  whatUsersLike: string[];
  whatUsersDontLike: string[];
  competitorsUsersMention: string[];
  sources: string[];
};

