# AGENTS.md

Instructions for any AI coding agent working in this repository.

## Project

A small web app. It shows Kaprekar's routine: sort a 4-digit number's
digits high to low and low to high, subtract, repeat, until it reaches
6174. The layout is the "Stage": one step at a time, played step by
step. See `PRODUCT.md` for the product register, audience, and design
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
- On Windows, `bun run <script>` can silently launch a `node.exe`
  child process for a script that resolves to a plain JS bin (this
  happened with `vite` and `tsc`). Check with
  `tasklist /FI "IMAGENAME eq node.exe"` after starting a long-running
  script (e.g. the dev server) the first time in a session. If Node
  shows up, point the script at the tool's entry file directly, e.g.
  `bun --bun node_modules/vite/bin/vite.js`, instead of the bare
  command name. The `dev`, `build`, and `preview` scripts in
  `package.json` already do this; keep new scripts consistent with
  them. `oxlint`, `bun check`, and `bun test` are unaffected: `oxlint`
  ships a real native binary, and `bun check` and `bun test` never
  leave Bun. The `build` script type-checks with `bun check -b`.
- Run `bun --bun run build`, `bun --bun run lint`, and
  `bun --bun run test` after any code change. Fix warnings and failing
  tests before finishing.
- Use the `font-mono` utility for every digit, and the default fonts
  for words.
- Every `el.animate()` path must check `reducedMotion()` from
  `src/lib/stage-motion.ts`: CSS media rules do not stop the Web
  Animations API.
- Follow the existing color token system in `src/index.css`. Add new
  colors as OKLCH tokens, light and dark, with contrast checked using
  `src/lib/color-contrast.ts`, not as one-off hex values in components.
- Keep components small and colocated under `src/components/`. Shared
  primitives live in `src/components/ui/` (shadcn).
- `src/lib/kaprekar.ts` has regression tests in `kaprekar.test.ts`. Add
  a test alongside any behavior change there.
- `src/lib/color-contrast.ts` has regression tests in
  `color-contrast.test.ts` that read the actual OKLCH values out of
  `src/index.css` and assert WCAG contrast minimums. Run
  `bun --bun run test` after any `index.css` token change, and add a
  case there for a new token pair that needs a guaranteed ratio.

## Commands

```sh
bun install
bun --bun run dev         # start the dev server
bun --bun run build       # type-check and build
bun --bun run lint        # oxlint
bun --bun run test        # regression tests (bun:test)
bun --bun run preview     # preview the production build
```

## Structure

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
.github/workflows/           # GitHub Pages deploy
```

## Verification

`src/lib/` and `src/hooks/` have regression tests for their pure
logic; run them with `bun --bun run test`. The UI has no test suite. Before calling a UI
change done:

1. Type-check, lint, and run the tests (see above).
2. Check it in the browser, at a mobile width and a desktop width, in
   both light and dark mode.
3. If a fix targets a specific reported bug, confirm the fix with a
   measurement (a screenshot, a computed contrast ratio, a DOM rect),
   not by inspection alone.
