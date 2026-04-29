import type { AnalyzeOutput, RedditSignalItem } from "../types.js";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

function extractJsonObject(text: string): AnalyzeOutput {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model output is not valid JSON.");
  }
  const jsonText = text.slice(start, end + 1);
  return JSON.parse(jsonText) as AnalyzeOutput;
}

export async function summarizeSignals(params: {
  query: string;
  sources: RedditSignalItem[];
}): Promise<AnalyzeOutput> {
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL || "gpt-4.1-mini";
  if (!apiKey) {
    throw new Error("Missing LLM_API_KEY.");
  }

  const clippedSources = params.sources.slice(0, 20).map((s, i) => ({
    idx: i + 1,
    title: s.title,
    snippet: s.snippet,
    url: s.url
  }));

  const prompt = [
    "You analyze Reddit community signals.",
    "Return strict JSON only with keys:",
    "whatUsersLike, whatUsersDontLike, competitorsUsersMention, sources",
    "Do not include unmetNeeds.",
    `Query: ${params.query}`,
    `Source data: ${JSON.stringify(clippedSources)}`
  ].join("\n");

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      input: prompt,
      max_output_tokens: 800
    })
  });

  if (!response.ok) {
    throw new Error(`LLM provider failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { output_text?: string };
  const outputText = data.output_text ?? "";
  const parsed = extractJsonObject(outputText);

  return {
    whatUsersLike: parsed.whatUsersLike ?? [],
    whatUsersDontLike: parsed.whatUsersDontLike ?? [],
    competitorsUsersMention: parsed.competitorsUsersMention ?? [],
    sources: parsed.sources ?? clippedSources.map((s) => s.url)
  };
}

