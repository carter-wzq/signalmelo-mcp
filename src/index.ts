#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { analyzeRedditCommunitySignals } from "./tools/analyzeRedditCommunitySignals.js";

const server = new Server(
  {
    name: "signalmelo-mcp",
    version: "0.1.0"
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "analyze_reddit_community_signals",
      description:
        "Analyze Reddit community signals and return what users like, what users don't like, and competitors users mention.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Topic, product, or keyword to analyze." },
          subreddits: {
            type: "array",
            items: { type: "string" },
            description: "Optional subreddit list, e.g. ['SaaS', 'startups']."
          },
          timeRange: {
            type: "string",
            enum: ["7d", "30d", "90d"]
          },
          maxPosts: { type: "number", minimum: 5, maximum: 50 }
        },
        required: ["query"]
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "analyze_reddit_community_signals") {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }

  const output = await analyzeRedditCommunitySignals(request.params.arguments ?? {});
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(output, null, 2)
      }
    ]
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);

