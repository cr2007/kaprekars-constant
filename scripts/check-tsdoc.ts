/**
 * Checks every TSDoc block in `src/` and `e2e/` with the official TSDoc
 * parser. oxlint checks the tag names; this checks the syntax: a missing
 * hyphen after a `@param` name, an unclosed `{@link}`, an unescaped `>`.
 *
 * @remarks Run it with `bun --bun run check:tsdoc`. It exits with 1 on any finding.
 * @packageDocumentation
 */
import { TSDocParser } from '@microsoft/tsdoc'
import { Glob } from 'bun'

const parser = new TSDocParser()
let findings = 0
for (const pattern of ['src/**/*.{ts,tsx}', 'e2e/**/*.ts', 'scripts/**/*.ts']) {
  for await (const path of new Glob(pattern).scan('.')) {
    const text = await Bun.file(path).text()
    // A doc block opens with "/**" and white space, so a glob such as "src/**/*.ts" is not one.
    for (const block of text.matchAll(/\/\*\*\s[\s\S]*?\*\//g)) {
      // Step 1: the line where the block starts, so each finding points at its own line.
      const blockLine = text.slice(0, block.index).split('\n').length
      for (const message of parser.parseString(block[0]).log.messages) {
        const line = blockLine + block[0].slice(0, message.textRange.pos).split('\n').length - 1
        console.log(`${path}:${line}: ${message.messageId}: ${message.unformattedText}`)
        findings++
      }
    }
  }
}
process.exit(findings ? 1 : 0)
