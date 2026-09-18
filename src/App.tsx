import { type FormEvent, useState } from 'react'
import { KaprekarStepCard } from '@/components/kaprekar-step-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

  const reachedConstant = steps.at(-1)?.result === KAPREKAR_CONSTANT

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
    <div className="min-h-svh px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto flex max-w-xl flex-col gap-8">
        <header className="text-center">
          <p className="font-heading text-sm font-semibold tracking-wide text-primary uppercase">
            A number trick that always works
          </p>
          <h1 className="mt-2 font-heading text-4xl font-bold text-foreground sm:text-5xl">
            Kaprekar's constant
          </h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            Pick almost any 4-digit number. Sort its digits high to low and low to
            high, subtract, and repeat. You will land on{' '}
            <span className="font-semibold text-primary">6174</span> within 7
            steps, every time.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6"
        >
          <Label htmlFor="kaprekar-input">Your 4-digit number</Label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              id="kaprekar-input"
              inputMode="numeric"
              autoComplete="off"
              placeholder="e.g. 3524"
              value={rawInput}
              onChange={(event) => handleInputChange(event.target.value)}
              className="h-12 text-lg font-semibold tracking-widest sm:text-xl"
              aria-invalid={error ? true : undefined}
            />
            <div className="flex gap-2">
              <Button type="submit" size="lg" className="h-12 flex-1 px-5 text-base sm:flex-none">
                Calculate
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-12 px-4"
                onClick={handleRandom}
              >
                Random
              </Button>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>

        {steps.length > 0 && (
          <div className="flex flex-col gap-4">
            {steps.map((step, index) => (
              <KaprekarStepCard key={index} step={step} index={index} animate />
            ))}

            {reachedConstant && !wentFurther && (
              <div
                className="animate-step-in flex flex-col items-center gap-3 pt-2 text-center"
                style={{ animationDelay: `${steps.length * 90}ms` }}
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
              <p className="animate-step-in text-center text-sm text-muted-foreground">
                6174 leads straight back to itself. It is the routine's only
                resting point for 4-digit numbers with at least two different
                digits.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
