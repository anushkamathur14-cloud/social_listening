# Signal-Led Creative Response Demo

Real-time, event-driven ad creative pipeline for paid social. Detects local signals (weather, traffic, search trends, Reddit conversations), generates tailored creatives, validates against brand rules, simulates deployment, and optimizes based on performance — all streamed live to a dashboard.

**Built by [anushkainnovation.com/projects](https://anushkainnovation.com/projects)**

## Architecture

```
Signal Sources → Trigger Engine → AI Pipeline → Simulated Launch → Optimizer
     ↓                ↓               ↓              ↓                ↓
  SSE Live Dashboard (signal feed · pipeline tracker · creatives · metrics)
```

### Pipeline stages

1. **Detect** — Poll weather, airport delays, Google Trends, Reddit threads
2. **Generate** — LLM (or mock) creates persona-tailored ad variants
3. **Validate** — Rule engine checks brand safety, attribution, character limits
4. **Launch** — Simulated Meta/Smartly deployment (optional approval gate)
5. **Optimize** — Mock performance feedback; pause losers, scale winners

## Quick start

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Click **Inject Signal** to run the full pipeline instantly.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | No | Enables real LLM creative generation (mock fallback if missing) |
| `OPENWEATHER_API_KEY` | No | Live weather signals (mock fallback) |
| `AVIATION_API_KEY` | No | Live airport delay data (mock fallback) |
| `COPYRIGHT_ATTRIBUTION` | No | Portfolio URL stamped on every creative |
| `AUTO_LAUNCH` | No | `true` to skip approval gate (default: `false`) |
| `DEMO_MODE` | No | Enables mock fallbacks (default: `true`) |

## Interview talking points

- **Outside-in:** External signals (weather, Reddit, trends) drive creative, not calendar planning
- **Product-linked:** Creatives reference real local conditions and conversation context
- **Trust-but-verify:** AI generates; rule engine validates before any simulated launch
- **Incremental optimization:** Only scale winners; regenerate from top performers
- **Attribution by design:** Every creative carries portfolio link, validated at compliance

## API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/events/stream` | GET | SSE live event stream |
| `/api/signals/inject` | POST | Manual signal injection `{ type, market }` |
| `/api/campaigns` | GET | Campaigns, creatives, performance |
| `/api/campaigns/:id/approve` | POST | Approve pending campaign |
| `/api/runs` | GET/POST | Pipeline state / pause toggle |

## Tech stack

- Next.js 16 · TypeScript · Tailwind CSS
- SQLite + Drizzle ORM
- Server-Sent Events for real-time UI
- OpenAI (optional) · google-trends-api · Reddit public JSON API

## Optional: standalone poller

```bash
npm run poller
```

Runs signal ingestion in a separate process (the dev server also polls automatically).
