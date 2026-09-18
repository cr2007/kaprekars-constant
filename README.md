# Kaprekar's Constant

This app shows Kaprekar's routine in action.

Type any 4-digit number. Sort its digits high to low. Sort them low to
high. Subtract. Repeat. Every number with at least two different digits
reaches 6174 within seven steps.

## Features

- Live step-by-step calculation, with a compact view on small screens
  and a tile view on large screens.
- Light and dark theme, with a toggle.
- A book-mode layout for foldable devices with two screen segments.
  A button swaps which side holds the calculation.
- Full keyboard and screen reader support. Skip link, live status
  region, and labeled controls.

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
bun --bun run test      # run the regression tests
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
  App.tsx                 # main layout and state
  components/              # UI components
  components/ui/           # shadcn primitives
  hooks/                    # theme and book-side state
  lib/kaprekar.ts           # the routine itself
  lib/kaprekar.test.ts       # regression tests for the routine
public/
  fonts/                    # the custom heading font
```
