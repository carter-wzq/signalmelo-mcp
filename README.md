# signalmelo-mcp

Lightweight MCP server for Reddit community signals.

This server provides one tool only:

- `analyze_reddit_community_signals`

Output format is intentionally fixed:

- `whatUsersLike`
- `whatUsersDontLike`
- `competitorsUsersMention`
- `sources`


## BYOK

This server uses your own API keys. Usage and billing are tied to your provider accounts.

Required environment variables:

- `REDDIT_CLIENT_ID`
- `REDDIT_CLIENT_SECRET`
- `REDDIT_USER_AGENT`
- `LLM_API_KEY`

## Quick Start

```bash
npm install
npm run build
```

## Create Reddit API Credentials

1. Go to [Reddit app preferences](https://www.reddit.com/prefs/apps).
2. Click **create app** (or **create another app**).
3. Set app type to **script**.
4. Fill required fields:
   - `name`: any app name
   - `redirect uri`: you can use `http://localhost:3000` for this server
5. Save the app, then copy:
   - `client id` (under app name)
   - `secret`
6. Set environment variables:
   - `REDDIT_CLIENT_ID=<YOUR_REDDIT_CLIENT_ID>`
   - `REDDIT_CLIENT_SECRET=<YOUR_REDDIT_CLIENT_SECRET>`
   - `REDDIT_USER_AGENT=signalmelo-mcp/0.1 by your_reddit_username`

`REDDIT_USER_AGENT` should be descriptive and include your Reddit username.

## MCP Config Example

```json
{
  "mcpServers": {
    "signalmelo-mcp": {
      "command": "node",
      "args": ["<ABSOLUTE_PATH>/signalmelo-mcp/dist/index.js"],
      "env": {
        "REDDIT_CLIENT_ID": "<YOUR_REDDIT_CLIENT_ID>",
        "REDDIT_CLIENT_SECRET": "<YOUR_REDDIT_CLIENT_SECRET>",
        "REDDIT_USER_AGENT": "signalmelo-mcp/0.1 by your_reddit_username",
        "LLM_API_KEY": "<YOUR_LLM_API_KEY>",
      }
    }
  }
}
```

## Tool Input

```json
{
  "query": "notion alternative for startup teams",
  "subreddits": ["SaaS", "startups"],
  "timeRange": "30d",
  "maxPosts": 30
}
```

## Notes

- `subreddits` max length: 5
- `maxPosts` range: 5-50
- If model summarization fails, fallback output still returns `sources`.
- Reddit API requires a valid app and descriptive `REDDIT_USER_AGENT`.
- Never commit real credentials into git. Use env vars only.

