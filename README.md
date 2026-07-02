# Wonder Test

A minimal but real **creator upload → publish → engagement** slice for **Wonder TV** —
the moment a creator goes from "I have a video file" to "it's live and generating
engagement."

## Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS v4** with a custom, restrained design system (single typeface —
  ABC Diatype — soft neutral palette, tiny radii, light & dark themes via `next-themes`)
- **shadcn-style** components

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

## Scripts

| Command         | Description                |
| --------------- | -------------------------- |
| `npm run dev`   | Start the dev server       |
| `npm run build` | Production build           |
| `npm run start` | Serve the production build |
| `npm run lint`  | Lint                       |

## Notes

- The bundled ABC Diatype weights are trial fonts for local development — swap in the
  licensed `.woff2` files before any production ship.
