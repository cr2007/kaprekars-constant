/*
  A port of the circle stroke of rough-notation 0.5.1, which bundles the
  ellipse code of rough.js 4.3. The math and the order of the random draws
  are the same, so a seed and a size give the same path as the library.

  MIT License

  Copyright (c) 2020 Preet Shihn

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
*/

type Point = [number, number]

/** rough-notation's options for a circle: roughness 1.5, 9 curve steps, 95% curve fit. */
const ROUGHNESS = 1.5
const CURVE_STEP_COUNT = 9
const CURVE_FITTING = 0.95

/**
 * Returns the two pen loops that rough-notation draws for `type: 'circle'`, as SVG path data in draw order.
 *
 * @remarks The same seed and size always give the same paths.
 * Units are px, so the wobble stays pen sized on any box.
 *
 * @param cx - Center x.
 * @param cy - Center y.
 * @param width - Width of the box to circle, padding included.
 * @param height - Height of the box to circle, padding included.
 * @param seed - A whole number from 1 to 2^31 - 1. Zero is not valid.
 */
export function roughCircle(cx: number, cy: number, width: number, height: number, seed: number): [string, string] {
  // Step 1.1: the Park-Miller generator of rough.js. It keeps the full product as state.
  let state = seed
  const random = () => ((state = Math.imul(48271, state)) & 0x7fffffff) / 2 ** 31
  const offset = (min: number, max: number) => ROUGHNESS * (random() * (max - min) + min)
  const wobble = (x: number) => offset(-x, x)

  // Step 1.2: radii and step angle. Bigger boxes get more points, so the curve stays smooth.
  const psq = Math.sqrt(2 * Math.PI * Math.sqrt((Math.pow(width / 2, 2) + Math.pow(height / 2, 2)) / 2))
  const increment = (2 * Math.PI) / Math.max(CURVE_STEP_COUNT, (CURVE_STEP_COUNT / Math.sqrt(200)) * psq)
  let rx = Math.abs(width / 2)
  let ry = Math.abs(height / 2)
  rx += wobble(rx * (1 - CURVE_FITTING))
  ry += wobble(ry * (1 - CURVE_FITTING))

  // Step 1.3: two loops. The inner call runs first, as in the library, so the draws stay in order.
  const overlap = increment * offset(0.1, offset(0.4, 1))
  return [loop(1, overlap), loop(1.5, 0)]

  /** One loop: points round the ellipse, then a Catmull-Rom curve through them. */
  function loop(jitter: number, overshoot: number): string {
    // Step 2.1: the points. Each one moves by a small random amount; the start angle is random too.
    const start = wobble(0.5) - Math.PI / 2
    const at = (angle: number, scale = 1): Point => [
      wobble(jitter) + cx + scale * rx * Math.cos(angle),
      wobble(jitter) + cy + scale * ry * Math.sin(angle),
    ]
    const points = [at(start - increment, 0.9)]
    for (let angle = start; angle < 2 * Math.PI + start - 0.01; angle += increment) points.push(at(angle))
    points.push(
      at(start + 2 * Math.PI + overshoot * 0.5),
      at(start + overshoot, 0.98),
      at(start + overshoot * 0.5, 0.9)
    )

    // Step 2.2: cubic Beziers through the points, in rough-notation's path text format.
    let d = `M${points[1][0]} ${points[1][1]} `
    for (let i = 1; i + 2 < points.length; i++) {
      const [p0, p1, p2, p3] = [points[i - 1], points[i], points[i + 1], points[i + 2]]
      d += `C${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6}, `
      d += `${p2[0] + (p1[0] - p3[0]) / 6} ${p2[1] + (p1[1] - p3[1]) / 6}, ${p2[0]} ${p2[1]} `
    }
    return d.trim()
  }
}
