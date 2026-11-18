import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { oklchContrastRatio, type Oklch } from './color-contrast'

describe('oklchContrastRatio', () => {
  test('matches the WCAG reference ratio for black on white', () => {
    expect(oklchContrastRatio([1, 0, 0], [0, 0, 0])).toBeCloseTo(21, 0)
  })

  test('is 1 for two identical colors', () => {
    const color: Oklch = [0.5, 0.1, 168]
    expect(oklchContrastRatio(color, color)).toBeCloseTo(1, 5)
  })

  test('is symmetric regardless of argument order', () => {
    const a: Oklch = [0.9, 0.05, 168]
    const b: Oklch = [0.3, 0.1, 27]
    expect(oklchContrastRatio(a, b)).toBeCloseTo(oklchContrastRatio(b, a), 5)
  })

  test('matches the WCAG ratios of the sRGB primaries, so the OKLCH to sRGB math is right for hue too', () => {
    // OKLCH of pure red, blue and lime (CSS Color 4); ratios from the sRGB values: 3.998, 8.592, 15.304.
    const white: Oklch = [1, 0, 0]
    const black: Oklch = [0, 0, 0]
    expect(oklchContrastRatio([0.62796, 0.25768, 29.2339], white)).toBeCloseTo(3.998, 1)
    expect(oklchContrastRatio([0.45201, 0.31321, 264.052], white)).toBeCloseTo(8.592, 1)
    expect(oklchContrastRatio([0.86644, 0.29483, 142.4953], black)).toBeCloseTo(15.304, 1)
  })

  test('blends a translucent color in sRGB, as CSS does: 50% black over white is 3.98:1 to white', () => {
    expect(oklchContrastRatio([0, 0, 0], [1, 0, 0], 0.5)).toBeCloseTo(3.977, 1)
  })

  test('alpha compositing pulls the ratio toward the background', () => {
    const foreground: Oklch = [0.95, 0.01, 168]
    const background: Oklch = [0.2, 0.02, 168]
    const full = oklchContrastRatio(foreground, background, 1)
    const half = oklchContrastRatio(foreground, background, 0.5)
    expect(half).toBeLessThan(full)
    expect(half).toBeGreaterThan(1)
  })
})

/**
 * A tiny CSS custom-property reader, scoped to what `index.css` actually
 * contains: a flat `:root { --name: oklch(l c h); ... }` block, a flat
 * `.dark { ... }` block, and both again nested one level inside the first
 * `@media (prefers-contrast: more) { ... }` block. Good enough for this
 * file; not a general CSS parser.
 */
function extractBalancedBlock(css: string, startIndex: number): string {
  const openBrace = css.indexOf('{', startIndex)
  let depth = 1
  let i = openBrace + 1
  while (depth > 0 && i < css.length) {
    if (css[i] === '{') depth++
    else if (css[i] === '}') depth--
    i++
  }
  return css.slice(openBrace + 1, i - 1)
}

/** Returns the body of the first `selector { ... }` block at or after index `from`. */
function findSelectorBlock(css: string, selector: string, from = 0): string {
  const pattern = new RegExp(`(?:^|[\\s};])${selector.replace(/[.]/g, '\\.')}\\s*\\{`, 'm')
  const match = pattern.exec(css.slice(from))
  if (!match) throw new Error(`selector not found: ${selector}`)
  const absoluteIndex = from + match.index
  return extractBalancedBlock(css, absoluteIndex)
}

/** Reads the `--name` custom property from a block as an OKLCH triple. */
function readOklchVar(block: string, name: string): Oklch {
  const match = new RegExp(`--${name}:\\s*oklch\\(([^)]+)\\)`).exec(block)
  if (!match) throw new Error(`--${name} not found in block`)
  const [l, c, h] = match[1].trim().split(/\s+/).map(Number)
  return [l, c, h]
}

const css = readFileSync(new URL('../index.css', import.meta.url), 'utf-8')
const root = findSelectorBlock(css, ':root')
const dark = findSelectorBlock(css, '.dark')

const increasedContrastIndex = css.indexOf('prefers-contrast')
const increasedContrastBlock = extractBalancedBlock(css, increasedContrastIndex)
const rootIncreasedContrast = findSelectorBlock(increasedContrastBlock, ':root')
const darkIncreasedContrast = findSelectorBlock(increasedContrastBlock, '.dark')

describe('theme tokens in index.css', () => {
  test.each([
    ['light', root],
    ['dark', dark],
  ])('%s: primary-foreground on primary clears the HIG small-text aim of 7:1', (_name, block) => {
    const primary = readOklchVar(block, 'primary')
    const primaryForeground = readOklchVar(block, 'primary-foreground')
    expect(oklchContrastRatio(primaryForeground, primary)).toBeGreaterThanOrEqual(7)
  })

  test.each([
    ['light', root],
    ['dark', dark],
  ])('%s: muted-foreground stays readable on both background and card', (_name, block) => {
    const background = readOklchVar(block, 'background')
    const card = readOklchVar(block, 'card')
    const mutedForeground = readOklchVar(block, 'muted-foreground')
    expect(oklchContrastRatio(mutedForeground, background)).toBeGreaterThanOrEqual(4.5)
    expect(oklchContrastRatio(mutedForeground, card)).toBeGreaterThanOrEqual(4.5)
  })

  test.each([
    ['light', root, 0.12],
    ['dark', dark, 0.15],
  ])('%s: hero text stays readable over the faint 6174 watermark', (_name, block, alpha) => {
    // The watermark is primary at 12% (light) or 15% (dark) over the background. Both share hue 168, so mix L and C.
    const background = readOklchVar(block, 'background')
    const primary = readOklchVar(block, 'primary')
    const mix = (k: 0 | 1) => background[k] + (primary[k] - background[k]) * alpha
    const under: Oklch = [mix(0), mix(1), 168]
    expect(oklchContrastRatio(readOklchVar(block, 'muted-foreground'), under)).toBeGreaterThanOrEqual(4.5)
    expect(oklchContrastRatio(readOklchVar(block, 'foreground'), under)).toBeGreaterThanOrEqual(7)
    // The title 6174 is large bold text: 3:1.
    expect(oklchContrastRatio(primary, under)).toBeGreaterThanOrEqual(3)
  })

  test.each([
    ['light', root],
    ['dark', dark],
  ])('%s: primary digits on the card (the outlined start tiles) clear 4.5:1', (_name, block) => {
    expect(oklchContrastRatio(readOklchVar(block, 'primary'), readOklchVar(block, 'card'))).toBeGreaterThanOrEqual(4.5)
  })

  test.each([
    ['light', root],
    ['dark', dark],
  ])('%s: the number field edge clears 3:1 on the card and the page (WCAG 1.4.11)', (_name, block) => {
    const input = readOklchVar(block, 'input')
    expect(oklchContrastRatio(input, readOklchVar(block, 'card'))).toBeGreaterThanOrEqual(3)
    expect(oklchContrastRatio(input, readOklchVar(block, 'background'))).toBeGreaterThanOrEqual(3)
  })

  test('dark card reads as a distinct, brighter elevated surface above the page', () => {
    const background = readOklchVar(dark, 'background')
    const card = readOklchVar(dark, 'card')
    expect(card[0]).toBeGreaterThan(background[0])
    expect(oklchContrastRatio(card, background)).toBeGreaterThan(1.1)
  })

  test.each([
    ['light', root, rootIncreasedContrast],
    ['dark', dark, darkIncreasedContrast],
  ])('%s: prefers-contrast:more strengthens border and muted-foreground, never weakens them', (
    _name,
    defaultBlock,
    increasedBlock
  ) => {
    const background = readOklchVar(defaultBlock, 'background')
    const defaultBorder = readOklchVar(defaultBlock, 'border')
    const increasedBorder = readOklchVar(increasedBlock, 'border')
    expect(oklchContrastRatio(increasedBorder, background)).toBeGreaterThan(
      oklchContrastRatio(defaultBorder, background)
    )

    const defaultMutedForeground = readOklchVar(defaultBlock, 'muted-foreground')
    const increasedMutedForeground = readOklchVar(increasedBlock, 'muted-foreground')
    expect(oklchContrastRatio(increasedMutedForeground, background)).toBeGreaterThan(
      oklchContrastRatio(defaultMutedForeground, background)
    )
  })

  test.each([
    ['light', root, 1.3],
    ['dark', dark, 1.4],
  ])(
    "%s: the secondary button fill (\"Do one more round\") stays visible on the card fill",
    (_name, block, minRatio) => {
      // The button has no border, so --secondary needs lightness separation from --card on its own.
      // Dark has the higher bar: it went invisible (1.14:1) once the card got a fill.
      const card = readOklchVar(block, 'card')
      const secondary = readOklchVar(block, 'secondary')
      expect(oklchContrastRatio(secondary, card)).toBeGreaterThanOrEqual(minRatio)
    }
  )

  test.each([
    ['light', root],
    ['dark', dark],
  ])('%s: the graph-paper grid stays faint and never weakens text on it', (_name, block) => {
    // The grid lines sit under page text, so muted text must stay readable on
    // a line, and the line must stay a faint texture, not a pattern that competes.
    const background = readOklchVar(block, 'background')
    const grid = readOklchVar(block, 'grid')
    const mutedForeground = readOklchVar(block, 'muted-foreground')
    expect(oklchContrastRatio(mutedForeground, grid)).toBeGreaterThanOrEqual(4.5)
    const lineRatio = oklchContrastRatio(grid, background)
    expect(lineRatio).toBeGreaterThan(1.05)
    expect(lineRatio).toBeLessThan(1.25)
  })

  test.each([
    ['light', root],
    ['dark', dark],
  ])('%s: the hand-drawn mark clears the 3:1 non-text minimum on the card', (_name, block) => {
    const card = readOklchVar(block, 'card')
    const mark = readOklchVar(block, 'mark')
    expect(oklchContrastRatio(mark, card)).toBeGreaterThanOrEqual(3)
  })

  test.each([
    ['light', root],
    ['dark', dark],
  ])('%s: the chart tooltip (background text on a foreground fill) clears 4.5:1', (_name, block) => {
    const background = readOklchVar(block, 'background')
    const foreground = readOklchVar(block, 'foreground')
    expect(oklchContrastRatio(background, foreground)).toBeGreaterThanOrEqual(4.5)
  })
})
