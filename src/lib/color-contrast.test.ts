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
 * `.dark { ... }` block, and both again nested one level inside a single
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

function findSelectorBlock(css: string, selector: string, from = 0): string {
  const pattern = new RegExp(`(?:^|[\\s};])${selector.replace(/[.]/g, '\\.')}\\s*\\{`, 'm')
  const match = pattern.exec(css.slice(from))
  if (!match) throw new Error(`selector not found: ${selector}`)
  const absoluteIndex = from + match.index
  return extractBalancedBlock(css, absoluteIndex)
}

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
    ['light', root],
    ['dark', dark],
  ])(
    '%s: the non-reached step badge border stays a legible circle on the card fill',
    (_name, block) => {
      // Regression: bg-muted alone sits too close to bg-card to read as a
      // shape (see kaprekar-step-card.tsx); border-muted-foreground/60 is
      // the fix, checked here against its 3:1 non-text minimum.
      const card = readOklchVar(block, 'card')
      const mutedForeground = readOklchVar(block, 'muted-foreground')
      expect(oklchContrastRatio(mutedForeground, card, 0.6)).toBeGreaterThanOrEqual(3)
    }
  )
})
