/**
 * End-to-end regression tests: the production build in a real browser.
 * Each test guards a behavior that unit tests cannot reach (layout,
 * pointer events, focus, motion timing). Run them with
 * `bun --bun run test:e2e`; it builds first. Set CHROMIUM_PATH to use
 * another Chromium than /snap/bin/chromium.
 */
import { afterAll, beforeAll, expect, setDefaultTimeout, test } from 'bun:test'
import { existsSync } from 'node:fs'
import { type Browser, type Page, chromium } from 'playwright-core'

const PORT = 4179
const BASE = `http://localhost:${PORT}`
const CHROMIUM = process.env.CHROMIUM_PATH ?? '/snap/bin/chromium'

setDefaultTimeout(30_000)

let server: ReturnType<typeof Bun.spawn>
let browser: Browser

beforeAll(async () => {
  // Step 1: serve the build. `test:e2e` builds first, so dist/ is current.
  if (!existsSync(CHROMIUM)) throw new Error(`No Chromium at ${CHROMIUM}. Set CHROMIUM_PATH.`)
  server = Bun.spawn(['bun', '--bun', 'node_modules/vite/bin/vite.js', 'preview', '--port', String(PORT), '--strictPort'], {
    stdout: 'ignore',
    stderr: 'ignore',
  })
  // Step 2: wait until the server answers, then start one browser for all tests.
  for (let i = 0; i < 50; i++) {
    if (await fetch(BASE).then((r) => r.ok).catch(() => false)) break
    await Bun.sleep(100)
  }
  browser = await chromium.launch({ executablePath: CHROMIUM, headless: true })
})

afterAll(async () => {
  await browser?.close()
  server?.kill()
})

/** A new page at `path`, at a phone or desktop size. */
async function open(path: string, width = 1440, height = 900, options: { hasTouch?: boolean } = {}): Promise<Page> {
  const context = await browser.newContext({ viewport: { width, height }, ...options })
  const page = await context.newPage()
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' })
  return page
}

/** The stage heading, such as "Step 2 of 4". */
const heading = (page: Page) => page.locator('#stage-heading').textContent()

/** Waits until the stage shows `text` in its heading. */
const waitForStep = (page: Page, text: string, timeout = 10_000) =>
  page.waitForFunction((t) => document.querySelector('#stage-heading')?.textContent === t, text, { timeout })

/** Seeks every time-based animation to `ms` and holds it there, so a frame can be measured exactly. */
const freezeAt = (page: Page, ms: number) =>
  page.evaluate((t) => {
    for (const a of document.getAnimations()) {
      if (!(a.timeline instanceof DocumentTimeline)) continue
      a.pause()
      a.currentTime = t
    }
  }, ms)

test('a ?n= link plays the run from step 1, not from the end', async () => {
  const page = await open('/?n=2323')
  expect(await heading(page)).toBe('Step 1 of 4')
  await waitForStep(page, 'Step 2 of 4')
  await page.context().close()
})

test('the typed digits fly in from the slots of the empty stage', async () => {
  const page = await open('/', 390, 844)
  await page.locator('#number-input').pressSequentially('352')
  const slots = await page.locator('#input-note-slots > span').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().left))
  await page.keyboard.press('4')
  await page.waitForSelector('#sum-start')
  await freezeAt(page, 0)
  const start = await page.locator('#sum-start [aria-hidden="true"] > span').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().left))
  start.forEach((x, i) => expect(Math.abs(x - slots[i])).toBeLessThan(1))
  await page.context().close()
})

test('the input note explains a leading zero and four equal digits, with no alert box', async () => {
  const page = await open('/')
  const input = page.locator('#number-input')
  await input.pressSequentially('0')
  expect(await page.locator('#input-note-title').textContent()).toBe('Start with 1 to 9.')
  expect(await input.getAttribute('aria-invalid')).toBe('true')
  await input.fill('7777')
  expect(await page.locator('#input-note-title').textContent()).toBe('7777 stops at 0.')
  expect(await page.locator('[role="alert"]').count()).toBe(0)
  await page.context().close()
})

test('a click on the shown step in the trail stops autoplay there', async () => {
  const page = await open('/?n=2323')
  await page.locator('#trail-step-1').click()
  await page.waitForTimeout(4000)
  expect(await heading(page)).toBe('Step 1 of 4')
  await page.context().close()
})

test('Play after a pick plays the picked step first, then moves on', async () => {
  const page = await open('/?n=2323')
  await page.locator('#trail-step-2').click()
  await page.waitForTimeout(300)
  await page.locator('#play-button').click()
  // The picked step plays its motion again before autoplay moves on.
  const moving = await page.evaluate(() => document.querySelector('#stage-card')!.getAnimations({ subtree: true }).length)
  expect(moving).toBeGreaterThan(0)
  expect(await heading(page)).toBe('Step 2 of 4')
  await waitForStep(page, 'Step 3 of 4')
  await page.context().close()
})

test('a drag of the trail pill shows the step it ends on, with a mouse and with touch', async () => {
  const page = await open('/?n=2323', 1440, 900)
  await page.locator('#trail-step-1').click()
  const a = (await page.locator('#trail-step-1').boundingBox())!
  const b = (await page.locator('#trail-step-3').boundingBox())!
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2)
  await page.mouse.down()
  await page.mouse.move(b.x + b.width / 2, a.y + a.height / 2, { steps: 10 })
  await page.mouse.up()
  await waitForStep(page, 'Step 3 of 4', 2000)
  await page.context().close()

  // Touch: the same drag through CDP touch events, on a phone.
  const phone = await open('/?n=2323', 390, 844, { hasTouch: true })
  await phone.locator('#trail-step-1').tap()
  const p = (await phone.locator('#trail-step-1').boundingBox())!
  const q = (await phone.locator('#trail-step-3').boundingBox())!
  const cdp = await phone.context().newCDPSession(phone)
  const y = p.y + p.height / 2
  const at = (x: number) => [{ x, y }]
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: at(p.x + p.width / 2) })
  for (let k = 1; k <= 10; k++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: at(p.x + p.width / 2 + ((q.x - p.x) * k) / 10) })
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await waitForStep(phone, 'Step 3 of 4', 2000)
  await phone.context().close()
})

test('the skip link moves focus to the number field', async () => {
  const page = await open('/')
  await page.keyboard.press('Tab')
  expect(await page.evaluate(() => document.activeElement?.id)).toBe('skip-link')
  await page.keyboard.press('Enter')
  expect(await page.evaluate(() => document.activeElement?.id)).toBe('number-input')
  await page.context().close()
})

test('the routine stays beside the 6174 step until the circle starts, then the result shows', async () => {
  const page = await open('/?n=2323')
  await waitForStep(page, 'Step 4 of 4')
  // At the start of the 6174 step the routine and its heading still show.
  expect(await page.locator('#rounds-left').textContent()).toBe('Last round to 6174.')
  expect(await page.locator('#end-progress').evaluate((e) => getComputedStyle(e).opacity)).toBe('1')
  // Then the result takes its place.
  await page.waitForFunction(() => getComputedStyle(document.querySelector('#end-result')!).opacity === '1', null, { timeout: 8000 })
  await page.context().close()
})

test('"Do one more round" circles the start 6174 and the result 6174', async () => {
  const page = await open('/?n=2323')
  await page.waitForFunction(() => getComputedStyle(document.querySelector('#end-result')!).opacity === '1', null, { timeout: 15_000 })
  await page.locator('#one-more-button').click()
  await waitForStep(page, 'Step 5 of 5', 2000)
  expect(await page.locator('#hand-circle-start').count()).toBe(1)
  expect(await page.locator('#hand-circle').count()).toBe(1)
  await page.context().close()
})

test('the page has no sideways scroll on a phone, before and during a run', async () => {
  for (const path of ['/', '/?n=1004']) {
    const page = await open(path, 360, 780)
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
    await page.context().close()
  }
})
