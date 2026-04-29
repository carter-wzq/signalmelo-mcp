# Reddit Community Signals MCP Skill

## What it does

Analyzes Reddit discussions for a topic and returns three blocks only:

- What Users Like
- What Users Don't Like
- Competitors Users Mention


## Use when

- You need fast community signal extraction from Reddit.
- You want a compact output format for product or marketing decisions.

## Input

- `query` (required)
- `subreddits` (optional)
- `timeRange` (optional: `7d | 30d | 90d`)
- `maxPosts` (optional: `5-50`)

## Output

- `whatUsersLike: string[]`
- `whatUsersDontLike: string[]`
- `competitorsUsersMention: string[]`
- `sources: string[]`

## Requirements

- `REDDIT_CLIENT_ID`
- `REDDIT_CLIENT_SECRET`
- `REDDIT_USER_AGENT`
- `LLM_API_KEY`

