# CLAUDE.md

@AGENTS.md

Shared instructions for this repo live in `AGENTS.md`. This file holds
only the Claude-specific ones.

## Commits

- Write commit messages in the format of the `/conventional-commit`
  skill. Only the user can run that skill, so follow its format:
  `type(scope): subject`, a first line of 50 characters or fewer, a
  body wrapped at 72, and no ticket footer.
- Do not add a `Co-Authored-By` line for Claude, in this repo.
- Write commit messages in ASD-STE100 Simplified Technical English:
  short sentences, plain words, one fact per sentence.
- For a change with more than one concern, split it into more than
  one commit.

## After implementing a change

- Simplify the new code without losing functionality. Remove AI-slop
  tells: em dashes, emojis, filler comments.
- Add TSDoc on top of each function: a one-sentence summary, then
  `@param`, `@returns`, `@remarks` and `{@link}` only where they add a
  fact. Add `// Step X` (or `Step X.Y`) comments at each phase of a
  multi-step function. Keep both brief: they are for scanning.
  `bun --bun run check:tsdoc` and `lint` must pass.
- Add regression tests where they make sense: a unit test in
  `src/lib/` for logic, an e2e test in `e2e/app.test.ts` for a UI bug.
  Let the mutation score guide unit tests (`test:mutation`): add one for
  a surviving mutant that matters, and remove a test that only repeats
  what another test already checks.
- Before calling a refactor done, compare the checks before and after:
  unit, e2e, knip, the bundle size. A refactor keeps behavior the same.
- If a test fails, find the cause. Do not change the test to pass.
- Update `AGENTS.md`, `CLAUDE.md`, and `README.md` if the change makes
  any of their documented steps or structure stale.

## Design work

- This project has a `PRODUCT.md`. Read it before design work.
- Use the `impeccable` skill for design, redesign, or accessibility
  audit requests, when it is installed. Otherwise use
  `/plan-design-review` and `/emil-design-eng`.
- Verify a claimed fix (contrast, layout, alignment) by computing or
  measuring it, not by eyeballing a screenshot.
