/** One CSS `oklch(L C H)` triple: lightness (0-1), chroma, hue in degrees. */
export type Oklch = readonly [l: number, c: number, h: number]

/**
 * Converts an OKLCH color to linear sRGB.
 *
 * @see https://bottosson.github.io/posts/oklab/ for the formula, from Björn Ottosson.
 */
function oklchToLinearSrgb([l, c, hDeg]: Oklch): [number, number, number] {
  // Step 1: polar OKLCH to OKLab.
  const h = (hDeg * Math.PI) / 180
  const a = c * Math.cos(h)
  const b = c * Math.sin(h)

  // Step 2: OKLab to the cube roots of LMS, then cube them.
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b
  const s_ = l - 0.0894841775 * a - 1.291485548 * b

  const l3 = l_ ** 3
  const m3 = m_ ** 3
  const s3 = s_ ** 3

  // Step 3: LMS to linear sRGB.
  return [
    +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
  ]
}

/** Gamma-encodes one linear sRGB channel (0-1) to the standard 0-255 range. */
function linearChannelToSrgb255(value: number): number {
  const clamped = Math.min(1, Math.max(0, value))
  const encoded = clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055
  return encoded * 255
}

/** WCAG relative luminance of an sRGB color (each channel 0-255). */
function relativeLuminance([r, g, b]: [number, number, number]): number {
  /** One 0-255 channel to linear light, by the WCAG sRGB curve. */
  const linearize = (channel255: number) => {
    const channel = channel255 / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
}

/**
 * Blends `foreground` at `alpha` over `background` (both sRGB 0-255), as CSS does for a translucent color.
 *
 * @remarks This lets a test check a translucent border or fill against its backdrop.
 */
function alphaComposite(
  foreground: [number, number, number],
  background: [number, number, number],
  alpha: number
): [number, number, number] {
  return [
    foreground[0] * alpha + background[0] * (1 - alpha),
    foreground[1] * alpha + background[1] * (1 - alpha),
    foreground[2] * alpha + background[2] * (1 - alpha),
  ]
}

/**
 * Returns the WCAG 2.x contrast ratio between two OKLCH colors, from 1 (identical) to 21 (black on white).
 *
 * @param alpha - Opacity of `a` over `b`, for a translucent color such as `border-muted-foreground/60`.
 */
export function oklchContrastRatio(a: Oklch, b: Oklch, alpha = 1): number {
  const rgbA = oklchToLinearSrgb(a).map(linearChannelToSrgb255) as [number, number, number]
  const rgbB = oklchToLinearSrgb(b).map(linearChannelToSrgb255) as [number, number, number]
  const blended = alpha < 1 ? alphaComposite(rgbA, rgbB, alpha) : rgbA

  const luminanceA = relativeLuminance(blended)
  const luminanceB = relativeLuminance(rgbB)
  const lighter = Math.max(luminanceA, luminanceB)
  const darker = Math.min(luminanceA, luminanceB)
  return (lighter + 0.05) / (darker + 0.05)
}
