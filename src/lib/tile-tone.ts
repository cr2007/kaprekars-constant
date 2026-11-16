/**
 * The two tile looks. `solid` tiles are the numbers of the subtraction.
 * `outline` tiles are the number a step starts from: the same shape,
 * drawn in outline, so it reads as the input and not as an operand.
 */
export const TILE_TONE = {
  // The transparent border shows only in forced colors, where it keeps the tile's box.
  solid: 'border-2 border-transparent bg-primary text-primary-foreground shadow-sm',
  outline: 'border-2 border-primary bg-card text-primary',
} as const
