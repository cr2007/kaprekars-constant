export const DIGIT_COLORS: readonly string[] = [
  '#e63946',
  '#f3722c',
  '#f8961e',
  '#f9a620',
  '#f9c74f',
  '#f4845f',
  '#ef476f',
  '#ff6b6b',
  '#ffa62b',
  '#e85d75',
]

export function colorForDigit(digit: number): string {
  return DIGIT_COLORS[digit] ?? DIGIT_COLORS[0]
}
