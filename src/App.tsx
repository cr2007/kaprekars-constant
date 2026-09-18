import { type FormEvent, useState } from 'react'
import { BookSideToggle } from '@/components/book-side-toggle'
import { KaprekarStepCard } from '@/components/kaprekar-step-card'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useBookSide } from '@/hooks/use-book-side'
import {
  KAPREKAR_CONSTANT,
  type KaprekarStep,
  nextStep,
  randomValidNumber,
  runKaprekarRoutine,
  validateInput,
} from '@/lib/kaprekar'

export default function App() {
  const [rawInput, setRawInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [steps, setSteps] = useState<KaprekarStep[]>([])
  const [wentFurther, setWentFurther] = useState(false)
  const [runId, setRunId] = useState(0)
  const { side: bookSide, toggleSide: toggleBookSide } = useBookSide()

  const reachedConstant = steps.at(-1)?.result === KAPREKAR_CONSTANT
  const statusMessage =
    steps.length > 0 && reachedConstant
      ? `Reached 6174 in ${steps.length} step${steps.length === 1 ? '' : 's'}.`
      : ''

  function runFor(value: string) {
    const validation = validateInput(value)
    if (!validation.valid) {
      setError(validation.message ?? 'Enter a 4-digit number.')
      setSteps([])
      return
    }
    setError(null)
    setSteps(runKaprekarRoutine(Number(value)))
    setWentFurther(false)
    setRunId((id) => id + 1)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    runFor(rawInput)
  }

  function handleRandom() {
    const value = randomValidNumber().toString()
    setRawInput(value)
    runFor(value)
  }

  function handleInputChange(value: string) {
    const digitsOnly = value.replace(/\D/g, '').slice(0, 4)
    setRawInput(digitsOnly)
    if (steps.length > 0) {
      setSteps([])
      setWentFurther(false)
    }
    setError(null)
  }

  function handleGoFurther() {
    const last = steps.at(-1)
    if (!last) return
    setSteps([...steps, nextStep(last.result)])
    setWentFurther(true)
  }

  return (
    <div id="page" className="min-h-svh px-4 py-6 sm:px-6 sm:py-10">
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-50 focus-visible:rounded-lg focus-visible:bg-primary focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:font-semibold focus-visible:text-primary-foreground focus-visible:shadow-lg"
      >
        Skip to main content
      </a>

      <div
        id="page-content"
        data-book-side={bookSide}
        className="mx-auto flex w-full max-w-2xl flex-col gap-10 md:max-w-3xl lg:max-w-4xl xl:max-w-6xl"
      >
        <div id="top-bar" className="flex items-center justify-between">
          <span className="font-heading text-sm font-semibold text-muted-foreground">
            Kaprekar's routine
          </span>
          <div className="flex items-center gap-1">
            <BookSideToggle side={bookSide} toggleSide={toggleBookSide} />
            <ThemeToggle />
          </div>
        </div>

        <p role="status" className="sr-only">
          {statusMessage}
        </p>

        <main id="main-content" className="contents">
        <header id="hero" className="relative overflow-hidden text-center">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 -translate-y-1/2 select-none font-heading text-[10rem] leading-none font-bold text-primary/5 sm:text-[13rem]"
          >
            6174
          </span>
          <h1 className="text-balance font-heading text-[clamp(1.5rem,9vw,2.25rem)] font-bold text-foreground sm:text-5xl">
            Watch a number become <span className="text-primary">6174</span>
          </h1>
          <p className="mx-auto mt-4 max-w-prose text-pretty text-base text-muted-foreground sm:text-lg">
            Pick almost any 4-digit number. Sort its digits high to low and low to
            high, subtract, and repeat. Every path ends at the same place, within
            seven steps.
          </p>
        </header>

        <form
          id="input-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-3xl bg-secondary/40 p-5 sm:p-7"
        >
          <Label htmlFor="kaprekar-input" className="text-muted-foreground">
            Your 4-digit number
          </Label>
          <div id="input-row" className="flex flex-col gap-3 sm:flex-row">
            <Input
              id="kaprekar-input"
              inputMode="numeric"
              autoComplete="off"
              placeholder="e.g. 3524"
              value={rawInput}
              onChange={(event) => handleInputChange(event.target.value)}
              className="h-14 border-0 bg-card text-center text-2xl font-bold tracking-[0.3em] shadow-sm sm:text-3xl"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'input-error' : undefined}
            />
            <div id="input-actions" className="flex gap-2">
              <Button
                id="calculate-button"
                type="submit"
                size="lg"
                className="h-14 flex-1 px-5 text-base sm:flex-none"
              >
                Calculate
              </Button>
              <Button
                id="random-button"
                type="button"
                variant="outline"
                size="lg"
                className="h-14 border-0 bg-card px-4"
                onClick={handleRandom}
              >
                Random
              </Button>
            </div>
          </div>
          {error && (
            <p id="input-error" role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </form>

        {steps.length > 0 && (
          <div
            id="steps"
            key={runId}
            className="@container rounded-3xl border border-border p-5 sm:p-7"
          >
            <p id="steps-legend" className="mb-5 text-xs text-muted-foreground @5xl:hidden">
              Each round: digits sorted biggest first, minus digits sorted smallest first.
            </p>
            {steps.map((step, index) => (
              <KaprekarStepCard
                key={index}
                step={step}
                index={index}
                isFirst={index === 0}
                isLast={index === steps.length - 1}
                animate
              />
            ))}

            {reachedConstant && !wentFurther && (
              <div
                id="go-further-prompt"
                className="animate-step-in mt-2 flex flex-col items-center gap-3 border-t border-border pt-6 text-center"
                style={{ animationDelay: `${steps.length * 70}ms` }}
              >
                <p className="text-sm text-muted-foreground">
                  Curious what happens if you keep going?
                </p>
                <Button type="button" variant="secondary" onClick={handleGoFurther}>
                  Do one more round
                </Button>
              </div>
            )}

            {wentFurther && (
              <p
                id="loop-explainer"
                className="animate-step-in mt-2 border-t border-border pt-6 text-center text-sm text-muted-foreground"
              >
                6174 leads straight back to itself. It is the routine's only
                resting point for 4-digit numbers with at least two different
                digits.
              </p>
            )}
          </div>
        )}

        <section
          id="history"
          aria-labelledby="history-heading"
          className="flex flex-col gap-3 rounded-3xl bg-muted/60 p-5 sm:p-7"
        >
          <h2 id="history-heading" className="font-heading text-lg font-bold text-foreground">
            Where 6174 comes from
          </h2>
          <p className="max-w-prose text-pretty text-sm text-muted-foreground sm:text-base">
            The mathematician D. R. Kaprekar discovered this routine in 1949 while
            experimenting with digit arrangements by hand. He noticed that no
            matter which 4-digit number he started with, as long as its digits
            weren't all the same, repeating the sort-and-subtract process always
            arrived at 6174, and then stayed there. The same kind of routine
            exists for other digit lengths, each with its own resting number, but
            6174 is the most famous and now carries his name.
          </p>
          <a
            href="https://en.wikipedia.org/wiki/6174_(number)"
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            Read more on Wikipedia
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </section>
        </main>
      </div>
    </div>
  )
}
