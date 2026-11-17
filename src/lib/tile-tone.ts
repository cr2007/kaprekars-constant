/**
 * The two tile looks as class strings.
 *
 * @remarks `solid` tiles are the numbers of the subtraction.
 * `outline` tiles are the step input: the same shape in outline, so it does not read as an operand.
 */
export const TILE_TONE = {
  // The transparent border shows only in forced colors, where it keeps the tile's box.
  solid: 'border-2 border-transparent bg-primary text-primary-foreground shadow-sm',
  outline: 'border-2 border-primary bg-card text-primary',
} as const
