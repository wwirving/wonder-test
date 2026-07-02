# Wonder Test

A minimal but real **creator upload → publish → engagement** slice for **Wonder TV** —
the moment a creator goes from "I have a video file" to "it's live and generating
engagement."

> **Write-up** (overview, key decisions/tradeoffs, and "what I'd build with more time")
> lives in the accompanying Notion doc. This README covers the stack, how to run it, and
> where things live.

## Stack

- **Next.js 15** (App Router) + **TypeScript** — frontend + API routes in one repo
- **Supabase** — Postgres (data) + Storage (video, resumable browser→Storage upload)
- **Drizzle** — ORM + migrations
- **Twelve Labs** — async video indexing → tag/mood/description suggestions + auto-clips
- **Vidstack** — video player (`/watch`)
- **Tailwind CSS v4** + **shadcn-style** components — restrained dark/light design system
  (single typeface — ABC Diatype — soft neutral palette, tiny radii; `next-themes`)
- **Vercel** — hosting + serverless

## Routes

| Route           | Purpose                                                        |
| --------------- | ------------------------------------------------------------- |
| `/`             | Discover — published videos, grid or list view                |
| `/upload`       | Upload a video, add metadata, publish                         |
| `/upload/[id]`  | AI enrichment — Twelve Labs tag/mood suggestions + auto-clips |
| `/watch/[id]`   | Stream a video; collect engagement analytics                  |
| `/dashboard`    | A creator's uploads + analytics                               |

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values (see below)
npm run db:push              # create the schema in your Supabase Postgres
npm run db:seed              # optional — sample content
npm run tl:setup             # optional — creates a Twelve Labs index, prints its id
npm run dev                  # http://localhost:3000
```

Environment variables are documented inline in [`.env.example`](./.env.example):
Supabase DB connection (Drizzle), Supabase browser API (upload + Realtime), and the
Twelve Labs key + index id (AI features degrade gracefully if unset).

## Scripts

| Command             | Description                                    |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Start the dev server                          |
| `npm run build`     | Production build                              |
| `npm run start`     | Serve the production build                    |
| `npm run lint`      | Lint                                          |
| `npm run test`      | Run unit tests (Vitest)                       |
| `npm run db:push`   | Push the Drizzle schema to Postgres           |
| `npm run db:migrate`| Run generated migrations                      |
| `npm run db:seed`   | Seed sample content                           |
| `npm run db:studio` | Open Drizzle Studio                           |
| `npm run tl:setup`  | Create the shared Twelve Labs index           |

## Notes

- The bundled ABC Diatype weights are trial fonts for local development — swap in the
  licensed `.woff2` files before any production ship.
- No auth — a single implicit creator. See the write-up for the rationale and the
  production shape.
