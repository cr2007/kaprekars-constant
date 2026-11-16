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

## Element ids

Use these ids to name a page area in a chat or a test. Each id is
unique on the page in every state. Some show only in one state (a run,
6174, an error). Add new ones to this list, and keep it in sync. Do not
put a fixed id in a component that renders twice: pass it as a prop.

```
page                 # the whole page; data-book-side lives here
skip-link            # "Skip to main content"
page-header          # title, toggles and the number input
hero                 # the title and the subline (hgroup)
page-title           # the h1
hero-subline         # names 6174 as Kaprekar's constant
hero-watermark       # the faint 6174 behind the header (decoration)
book-side-toggle     # swaps book pages (two-screen devices only)
theme-toggle         # light or dark theme
number-label         # "Your 4-digit number"
number-input         # the 4-digit field
random-button        # "Random"
random-dice-icon     # the dice on the Random button
main-content         # <main>
playback-status      # screen-reader status of the playback
stage-block          # the stage, the trail and the playback bar
stage-view           # the stage and the trail
stage-card           # the stage card
stage-heading        # "Step 1 of 3"
constant-badge       # "Kaprekar's constant", shown at 6174
stage-sum            # the column sum
sum-start            # line: Start with
sum-biggest          # line: Biggest first
sum-smallest         # line: Smallest first
sum-difference       # line: Difference
hand-circle          # the drawn circle around 6174
stage-empty          # the empty stage before a run
input-note           # the empty stage: slots, hint, digits left, or the input error
  input-note-slots   # four slots that mirror the field
  input-note-title   # what to do next, or why the number cannot run
  input-note-detail  # the reason, for a leading 0 or four equal digits
how-it-works-intro   # the routine list in the empty stage
trail                # the step trail
trail-goal           # the 6174 goal at the end of the trail
playback-bar         # Back, Play and Next
back-button          # Back
play-button          # Play, Pause or Replay
next-button          # Next
end-panel            # the panel beside or under the stage
end-progress         # before 6174: rounds left and the routine
rounds-left          # "2 more rounds to 6174."
how-it-works         # the routine list in the end panel
end-result           # after 6174: fact, actions, try another
step-fact            # the step count fact and its chart
step-chart           # the 7-bar chart
one-more-button      # "Do one more round"
loop-note            # "6174 leads straight back to itself."
share-link           # the share button and its fallback text
share-button         # "Share 1234"
share-url            # the link as text, if the clipboard fails
try-another          # "Try another number" heading
quick-picks          # the quick-pick chips
challenge            # the step-count challenge
next-challenge       # "Next challenge"
all-steps            # "See all steps" disclosure
all-steps-summary    # its summary
all-steps-list       # its list of steps
page-footer          # the footer
origin-details       # "Where 6174 comes from" disclosure
origin-summary       # its summary
origin-text          # its paragraph
wikipedia-link       # "Read more on Wikipedia"
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
