# Parley

> Two AI models debate until they agree on a plan.

Parley is an open-source collaborative planning tool that leverages dual AI models to create comprehensive, well-vetted plans. Select any two models from 300+ options via OpenRouter, enter your planning prompt, and watch them deliberate in real-time until they reach consensus.

## Features

- **Dual Model Selection** - Choose any two AI models from OpenRouter's extensive catalog
- **Real-time Streaming** - Watch agents think and respond as it happens
- **Human Intervention** - Jump into the conversation anytime to steer direction
- **Agreement Detection** - Planning automatically concludes when both agents agree
- **All Cloudflare** - Runs on Cloudflare Pages + Workers for edge performance

## How It Works

1. **Agent A (Proposer)** creates an initial plan based on your prompt
2. **Agent B (Critic)** reviews and provides constructive feedback
3. Agents iterate back and forth, refining the plan
4. When both agents agree, the final plan is presented
5. You can intervene at any point to add context or redirect

## Tech Stack

- **Frontend**: SvelteKit 2 + Svelte 5
- **Styling**: Tailwind CSS v4
- **Backend**: Cloudflare Workers
- **AI**: OpenRouter API (300+ models)
- **Streaming**: Server-Sent Events (SSE)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) or Node.js
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- OpenRouter API key

### Installation

```bash
cd packages/parley
bun install
```

### Configuration

Set your OpenRouter API key:

```bash
# For local development
echo "OPENROUTER_API_KEY=your_key_here" > .dev.vars

# For production
wrangler secret put OPENROUTER_API_KEY
```

### Development

```bash
bun run dev
```

### Deployment

```bash
bun run build
bun run deploy
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | Your OpenRouter API key |

## Agent Prompts

Agents are equipped with specialized tools for planning:

- `<think>` - Internal reasoning (visible to users)
- `<propose_plan>` - Submit or update the plan
- `<critique>` - Provide constructive criticism
- `<ask_question>` - Request clarification
- `<agree>` - Accept the current plan

## License

MIT

## Author

Built by [coey.dev](https://coey.dev)
