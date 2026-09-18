# CLAUDE.md

@AGENTS.md

Shared instructions for this repo live in `AGENTS.md`. This file holds
only the Claude-specific ones.

## Commits

- Draft commit messages with the `/conventional-commit` skill.
- Do not add a `Co-Authored-By` line for Claude, in this repo.
- Write commit messages in ASD-STE100 Simplified Technical English:
  short sentences, plain words, one fact per sentence.
- For a change with more than one concern, split it into more than
  one commit.

## After implementing a change

- Simplify the new code without losing functionality. Remove AI-slop
  tells: em dashes, emojis, filler comments.
- Add TSDoc on top of each function and step-level (`Step X.Y`)
  comments inside multi-step methods.
- Add regression tests where they make sense.
- Update `AGENTS.md`, `CLAUDE.md`, and `README.md` if the change makes
  any of their documented steps or structure stale.

## Design work

- This project has a `PRODUCT.md`. Read it before design work.
- Use the `impeccable` skill for design, redesign, or accessibility
  audit requests.
- Verify a claimed fix (contrast, layout, alignment) by computing or
  measuring it, not by eyeballing a screenshot.
