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
- Run `bun --bun run build`, `bun --bun run lint`, `bun --bun run test`,
  `bun --bun run check:unused` and `bun --bun run check:tsdoc` after any
  code change. Run `bun --bun run test:e2e` too after a change to the
  UI, motion, or playback. CI runs all of these on each pull request.
  Fix warnings and failing checks before finishing. Do not change a
  test to make it pass: find why it fails.
- Use the `font-mono` utility for every digit, and the default fonts
  for words.
- Every `el.animate()` path must check `reducedMotion()` from
  `src/lib/motion.ts`: CSS media rules do not stop the Web Animations
  API. Take easings and springs from `motion.ts` (`EASE_OUT`,
  `EASE_IN_OUT`, `bezier()`, `spring()`), not new copies.
- Keep motion math pure: a plan as plain data in `src/lib/` (such as
  `sort-timeline.ts`), so unit and mutation tests can check it with no
  DOM. The DOM players (`stage-motion.ts`, `pill-motion.ts`) only
  measure and animate; components and hooks only call them. The dice
  icon still keeps its own pose math; move it only when you change it.
- Write TSDoc that is brief and easy to scan: a one-sentence summary,
  then tags only where they add a fact (`@param name - ...` for units,
  ranges or what null means; `@returns`; `@remarks` for the why;
  `{@link Name}` to related code). Mark each phase of a long function
  with a `// Step N:` comment (`Step N.M` for a sub-phase).
  `check:tsdoc` (the @microsoft/tsdoc parser) and oxlint's jsdoc rules
  check the syntax and the tag names.
- Size layout that holds text with container queries in `rem`
  (`@container` and `@max-[19rem]:`), not viewport `px` breakpoints:
  a `rem` breakpoint also fires at 200% text. Check a change at 280 px
  and at 200% text; `e2e/app.test.ts` checks both.
- Export a constant or a helper from `src/lib/`, not from a component
  file: a component file that exports other things breaks fast refresh
  (oxlint `only-export-components`).
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
bun --bun run test        # unit tests in src/ (bun:test)
bun --bun run test:e2e    # build, then browser tests in e2e/ (playwright-core)
bun --bun run check:unused # knip: unused files, exports, dependencies
bun --bun run check:tsdoc # TSDoc syntax, with the @microsoft/tsdoc parser
bun --bun run test:mutation # Stryker: mutation score of the pure code in src/lib
bun --bun run preview     # preview the production build
```

## Structure

```
src/
  App.tsx                    # the Stage layout: header, field, stage, panels
  components/hero.tsx        # title, subline and the 6174 watermark
  components/stage-step.tsx  # the column sum of one step, and its circles
  components/trail.tsx       # the step trail with the draggable pill
  components/playback-bar.tsx # Back, Play and Next
  components/input-note.tsx  # the empty stage: slots, hint, input errors
  components/end-panel.tsx   # rounds left, then the result and next number
  components/disclosures.tsx # "See all steps" and "Where 6174 comes from"
  components/                # also the smaller parts (challenge, quick picks)
  components/ui/             # shadcn primitives
  components/icons/          # the dice icon that rolls on hover
  hooks/use-run.ts           # run state, synced with ?n=
  hooks/use-playback.ts      # which step the stage shows, autoplay, Play
  hooks/use-pill-drag.ts     # the trail pill's taps, drags and glides
  hooks/                     # also theme and book-side state
  lib/kaprekar.ts            # the routine itself
  lib/motion.ts              # reducedMotion, easings, bezier() and spring()
  lib/sort-timeline.ts       # the plan of one step's sort, as plain data
  lib/stage-motion.ts        # plays the sort, the slot flight, handoff and 6174 arrival
  lib/pill-motion.ts         # the trail pill's glide and lift in the DOM
  lib/tile-tone.ts           # solid and outline tile looks
  lib/stats.ts               # step counts over all valid inputs
  lib/url.ts                 # ?n= read, write and share link
  lib/rough-circle.ts        # seeded hand-drawn circle (MIT port)
  lib/color-contrast.ts      # OKLCH contrast-ratio math for theme tokens
  lib/*.test.ts              # unit tests (bun:test)
e2e/app.test.ts              # browser regression tests on the production build
scripts/check-tsdoc.ts       # the TSDoc syntax check
knip.json                    # knip config (keeps utils.ts for shadcn; Stryker false positive)
stryker.config.json          # mutation testing scope: the pure code in src/lib
.github/workflows/ci.yml     # CI: lint, knip, TSDoc, unit and e2e on each pull request
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
skip-link            # "Skip to the number field"
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
random-dice-icon     # the dice on the Random button; they roll on hover
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
hand-circle          # the drawn circle around the 6174 result
hand-circle-start    # the drawn circle around the start 6174, on the loop step only
stage-empty          # the empty stage before a run
input-note           # the empty stage: slots, hint, digits left, or the input error
  input-note-slots   # four slots that mirror the field
  input-note-title   # what to do next, or why the number cannot run
  input-note-detail  # the reason, for a leading 0 or four equal digits
how-it-works-intro   # the routine list in the empty stage
trail                # the step trail: tap a step, or drag the pill
  trail-steps        # the fieldset of steps
  trail-step-N       # step N in the trail (trail-step-1, trail-step-2, ...)
trail-goal           # the 6174 goal at the end of the trail
playback-bar         # Back, Play and Next
back-button          # Back
play-button          # Play, Pause or Replay
next-button          # Next
end-panel            # the panel beside or under the stage
end-progress         # before 6174: rounds left and the routine
rounds-left          # "2 more rounds to 6174.", then "Last round to 6174."
how-it-works         # the routine list in the end panel
end-result           # after 6174: fact, actions, try another
step-fact            # the step count fact and its chart
step-chart           # the 7-bar chart
one-more-button      # "Do one more round"
loop-note            # "6174 leads straight back to itself."
share-link           # the share button and its fallback text
share-button         # "Share 1234"
share-url            # the link as text, if the clipboard fails
try-another-section  # quick picks and the challenge, under its heading
try-another          # "Try another number" heading
quick-picks          # the quick-pick chips
challenge            # the step-count challenge
next-challenge       # "Next challenge"
all-steps            # "See all steps" disclosure
all-steps-summary    # its summary
all-steps-list       # its list of steps
origin-details       # "Where 6174 comes from" disclosure; wide column on wide screens
origin-summary       # its summary
origin-text          # its paragraph
wikipedia-link       # "Read more on Wikipedia"
```

## Pull requests

- Put measured numbers (tests, mutation score, bundle size) in the PR
  body only after CI passes on the pushed head.
- Show proof (screenshots, video) in the PR body. Upload each file to
  GitHub, then embed the `.url` that comes back:

  ```sh
  curl -s "https://uploads.github.com/user-attachments/assets?name=<file>&content_type=<mime>&repository_id=<id>" \
    -X POST -H "Authorization: Bearer $(gh auth token)" \
    -H "Accept: application/json" --data-binary @<file>
  ```

  Get `<id>` with `gh api repos/<owner>/<repo> --jq .id`. The files go
  to the same CDN as drag and drop, and have the repo's visibility. A
  422 means the file type is not supported; a 404 means a bad repo id
  or no push access.
- Embed an image as `![alt](url)`. For a video, use `video/mp4` or
  `video/webm`, and put the URL alone on its own line: GitHub then
  shows a player (image syntax does not). Playwright records WebM;
  convert it first, for wide playback:
  `ffmpeg -i in.webm -c:v libx264 -pix_fmt yuv420p out.mp4`.
- Never push proof files to a branch of this repo. Do not commit
  `.github/pr-assets`.

## Verification

`src/lib/` and `src/hooks/` have unit tests for their pure logic; run
them with `bun --bun run test`. `e2e/app.test.ts` runs the production
build in Chromium for what unit tests cannot reach: playback, the
trail's clicks and drags, focus, the input note, the end panel timing.
It needs a Chromium at `/snap/bin/chromium`, or set `CHROMIUM_PATH`.
Add an e2e test for a fixed UI bug, so it cannot come back. Keep each
test on one behavior; wait for a condition, not a fixed time, where
you can.

Judge unit tests by the bugs they catch, not by their count. Run
`bun --bun run test:mutation` after a change to the pure code in
`src/lib/`. It needs no browser, but takes 20 to 30 minutes. A
surviving mutant in logic that matters needs a test. A test that only
repeats what another test checks can go. Stryker runs `bun test` as a
command runner; `stryker.config.json` points `tsconfigFile` at a file
that does not exist, because Stryker's TypeScript 6 hooks crash on
TypeScript 7.

Before calling a UI change done:

1. Type-check, lint, and run the unit and e2e tests (see above).
2. Check it in the browser, at a mobile width and a desktop width, in
   both light and dark mode.
3. If a fix targets a specific reported bug, confirm the fix with a
   measurement (a screenshot, a computed contrast ratio, a DOM rect),
   not by inspection alone.
