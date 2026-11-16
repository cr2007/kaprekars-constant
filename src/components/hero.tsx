/**
 * The title block: the h1, a subline that names 6174 as Kaprekar's
 * constant, and a faint 6174 behind them. On phones the block spans the
 * header, centered, and holds the watermark; from sm up its wrapper is
 * static, so the watermark fills the whole header (the header is the
 * positioned, isolated parent).
 */
export function Hero() {
  return (
    <div className="relative max-sm:col-span-2 max-sm:text-center sm:static">
      {/* Decoration (WCAG 1.4.3 "incidental"). CSS content keeps the digits out of the DOM text: copy, find and axe skip them. */}
      <span
        id="hero-watermark"
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden font-mono text-[min(8rem,30vw)] leading-none font-bold text-primary/12 before:content-['6174'] sm:justify-end lg:text-[10rem] dark:text-primary/15"
      />
      {/* WHATWG hgroup: one heading, then a p that names the constant. Phones: room for the toggles on
          both sides of the title only; the subline under them uses the full width, one sentence per line. */}
      <hgroup id="hero" className="flex flex-col gap-1">
        <h1 id="page-title" className="text-balance font-heading max-sm:px-11 text-[clamp(1.25rem,6.2vw,2rem)] leading-tight font-bold text-foreground lg:text-4xl">
          Watch a number become <span className="font-mono text-primary">6174</span>
        </h1>
        <p id="hero-subline" className="text-pretty text-base text-muted-foreground lg:text-lg">
          <span className="font-mono">6174</span> is Kaprekar's constant.{' '}
          <span className="max-sm:block">
            Almost every <span className="font-mono">4</span>-digit number ends there.
          </span>
        </p>
      </hgroup>
    </div>
  )
}
