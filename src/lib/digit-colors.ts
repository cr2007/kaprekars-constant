// Deepened from the original pastel set so white tile text clears
// WCAG contrast (>=3:1, the large-bold-text threshold) against every one.
export const DIGIT_COLORS: readonly string[] = [
  '#e63946',
  '#f05d0e',
  '#d07506',
  '#c57b05',
  '#b88406',
  '#f15d2d',
  '#ef476f',
  '#ff4a4a',
  '#ce7800',
  '#e85d75',
]

export function colorForDigit(digit: number): string {
  return DIGIT_COLORS[digit] ?? DIGIT_COLORS[0]
}
