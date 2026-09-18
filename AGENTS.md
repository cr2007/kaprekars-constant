# AGENTS.md

Instructions for any AI coding agent working in this repository.

## Project

A small web app. It shows Kaprekar's routine: sort a 4-digit number's
digits high to low and low to high, subtract, repeat, until it reaches
6174. See `PRODUCT.md` for the product register, audience, and design
principles.

## Stack

- Vite, React, TypeScript
- Tailwind CSS v4
- shadcn/ui, Radix Nova preset (`components.json`)
- Bun as the runtime and package manager

## Rules

- Use Bun for everything. Run scripts as `bun --bun run <script>`, not
  `npm`/`npx`/`node`. Use `bunx --bun` in place of `npx`.
- Never use `npm`, `yarn`, or `pnpm` commands or lockfiles.
- Run `bun --bun x tsc -b` and `bun --bun run lint` after any code
  change. Fix warnings before finishing.
- Follow the existing color token system in `src/index.css`. Add new
  colors as OKLCH tokens, light and dark, with contrast checked, not
  as one-off hex values in components.
- Keep components small and colocated under `src/components/`. Shared
  primitives live in `src/components/ui/` (shadcn).

## Commands

```sh
bun install
bun --bun dev             # start the dev server
bun --bun run build       # type-check and build
bun --bun run lint        # oxlint
bun --bun run preview     # preview the production build
```

## Structure

```
src/
  App.tsx                 # main layout and state
  components/              # UI components
  components/ui/           # shadcn primitives
  hooks/                    # theme and book-side state
  lib/kaprekar.ts           # the routine itself
public/
  fonts/                    # the custom heading font
.github/workflows/          # GitHub Pages deploy
```

## Verification

There is no test suite. Before calling a UI change done:

1. Type-check and lint (see above).
2. Check it in the browser, at a mobile width and a desktop width, in
   both light and dark mode.
3. If a fix targets a specific reported bug, confirm the fix with a
   measurement (a screenshot, a computed contrast ratio, a DOM rect),
   not by inspection alone.
