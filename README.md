# Kaprekar's Constant

This app shows Kaprekar's routine in action.

Type any 4-digit number. Sort its digits high to low. Sort them low to
high. Subtract. Repeat. Every number with at least two different digits
reaches 6174 within seven steps.

## Features

- The Stage: one step at a time, large, played step by step. A trail
  and a playback bar move between steps, and each result moves down
  into the next input. At 6174 the tiles hop and a pen circle goes
  round the answer.
- After 6174: the step count in context, one more round, a share link
  (`?n=1004` opens that run), quick picks and a step-count challenge.
- Light and dark theme, with a toggle. Both meet WCAG AA contrast, and
  both get a stronger color scheme when the OS "increase contrast"
  setting is on.
- Foldables with two screen segments get two pages. Book posture: the
  stage on one page, the input and reading on the other; a button swaps
  them. Tabletop posture: the stage on top, the controls below.
- Full keyboard and screen reader support. Skip link, landmarks, an
  output live region, a native radio group for the steps, and the arrow
  keys to step through a run.

## Stack

- Vite, React, TypeScript
- Tailwind CSS v4
- shadcn/ui (Radix Nova preset)
- Bun as the runtime and package manager

## Run it

Install Bun first: https://bun.sh

```sh
bun install
bun --bun dev
```

Open the printed local URL in your browser.

## Other commands

```sh
bun --bun run build     # type-check and build for production
bun --bun run lint      # run oxlint
bun --bun run test      # run the unit tests
bun --bun run test:e2e  # build, then run the browser tests (needs Chromium)
bun --bun run check:unused  # find unused files, exports and dependencies (knip)
bun --bun run check:tsdoc   # check the TSDoc syntax
bun --bun run test:mutation # mutation testing of the pure code (Stryker, 20 to 30 min)
bun --bun run preview   # preview the production build
```

## Deployment

Push to `main` to deploy to GitHub Pages. The workflow is at
`.github/workflows/deploy.yml`. It calls a reusable workflow from
[cr2007/actions](https://github.com/cr2007/actions).

Set the Pages source to "GitHub Actions" once, in repo settings, under
Pages.

The Vite `base` path in `vite.config.ts` reads the repo name from
`GITHUB_REPOSITORY`, set by GitHub Actions. It follows a repo rename
on its own. If you deploy to a custom domain instead, set `base` back
to `/`.

## Project structure

```
src/
  App.tsx                    # the Stage layout
  components/                # UI components (stage step, trail, end panel)
  components/ui/             # shadcn primitives
  components/icons/          # one-off icons shadcn/lucide don't ship
  hooks/use-run.ts           # run state, synced with ?n=
  hooks/use-playback.ts      # which step the stage shows, autoplay
  hooks/                     # also theme and book-side state
  lib/kaprekar.ts            # the routine itself
  lib/stage-motion.ts        # step, handoff and 6174 arrival motion
  lib/stats.ts               # step counts over all valid inputs
  lib/url.ts                 # ?n= read, write and share link
  lib/rough-circle.ts        # seeded hand-drawn circle (MIT port)
  lib/color-contrast.ts      # OKLCH contrast-ratio math for theme tokens
  lib/*.test.ts              # regression tests (bun:test)
public/
  fonts/                     # Endless, the custom text font
  favicon.ico                # 16 and 32 px tab icon frames
```
