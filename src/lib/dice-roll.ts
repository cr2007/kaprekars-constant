/** The faces of the two dice: [back, front]. */
export type Pair = readonly [number, number]

/** The faces at rest, as in the src icon: back die 2, front die 3. */
export const REST_PAIR: Pair = [2, 3]

/** The faces a roll can show. Face 6 has its own pip layout, so it stays legible at 20 px. */
export const ROLL_FACES: readonly number[] = [1, 2, 3, 4, 5, 6]

/** True when two pairs show the same faces. */
const same = (a: Pair, b: Pair) => a[0] === b[0] && a[1] === b[1]

/**
 * Picks a new pair of faces, uniform over {@link ROLL_FACES} pairs except `last` and the rest pair.
 *
 * @remarks Each roll then visibly changes the dice.
 * @param random - Returns a number in [0, 1), as `Math.random` does.
 */
export function rollPair(last: Pair, random: () => number = Math.random): Pair {
  const pairs = ROLL_FACES.flatMap((back) => ROLL_FACES.map((front): Pair => [back, front])).filter(
    (pair) => !same(pair, last) && !same(pair, REST_PAIR)
  )
  return pairs[Math.floor(random() * pairs.length)]
}
