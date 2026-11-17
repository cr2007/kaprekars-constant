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

/** Opens `path` with the root text size raised to 200%, as a large Android text setting does. */
async function openLargeText(path: string, width: number, height: number): Promise<Page> {
  const context = await browser.newContext({ viewport: { width, height } })
  await context.addInitScript(() =>
    document.addEventListener('DOMContentLoaded', () => {
      const style = document.createElement('style')
      style.textContent = 'html { font-size: 200%; }'
      document.head.append(style)
    })
  )
  const page = await context.newPage()
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' })
  return page
}

/** No sideways scroll, the title clear of the theme toggle, room for every trail number, and the playback bar inside the gutters. */
async function checkFits(page: Page, label: string) {
  const r = await page.evaluate(() => {
    const steps = [...document.querySelectorAll('#trail-steps label')].map((l) => {
      const n = l.querySelector('.trail-num')
      return n ? l.getBoundingClientRect().width - n.getBoundingClientRect().width : 99
    })
    const bar = document.querySelector('#playback-bar fieldset')?.getBoundingClientRect()
    const column = document.querySelector('#stage-block')!.getBoundingClientRect()
    const toggle = document.querySelector('#theme-toggle')!.getBoundingClientRect()
    const title = document.createRange()
    title.selectNodeContents(document.querySelector('#page-title')!)
    return {
      sideways: document.documentElement.scrollWidth > innerWidth,
      titleUnderToggle: [...title.getClientRects()].some(
        (l) => l.left < toggle.right && l.right > toggle.left && l.top < toggle.bottom && l.bottom > toggle.top
      ),
      tightest: Math.min(99, ...steps),
      barOut: bar ? bar.right > column.right + 0.5 || bar.left < column.left - 0.5 : false,
    }
  })
  expect({ label, ...r, roomy: r.tightest >= 4 }).toEqual({ label, ...r, sideways: false, titleUnderToggle: false, barOut: false, roomy: true })
}

test('the page fits a 280 px screen and 200% text, with the longest run plus the loop round', async () => {
  // 1004 takes 7 steps; "Do one more round" makes 8 trail steps, the most a run can have.
  const cases: [string, () => Promise<Page>][] = [
    ['280 px', () => open('/?n=1004', 280, 653)],
    ['320 px', () => open('/?n=1004', 320, 568)],
    ['360 px', () => open('/?n=1004', 360, 780)],
    ['320 px, 200% text', () => openLargeText('/?n=1004', 320, 653)],
    ['390 px, 200% text', () => openLargeText('/?n=1004', 390, 844)],
  ]
  for (const [label, make] of cases) {
    const page = await make()
    await page.locator('#trail-step-7').click()
    await page.waitForFunction(() => getComputedStyle(document.querySelector('#end-result')!).opacity === '1', null, { timeout: 8000 })
    await page.locator('#one-more-button').click()
    await waitForStep(page, 'Step 8 of 8', 2000)
    await checkFits(page, `${label} 8 steps`)
    await page.context().close()
  }
  for (const width of [320, 390]) {
    const empty = await openLargeText('/', width, 844)
    await checkFits(empty, `empty stage, ${width} px, 200% text`)
    await empty.context().close()
  }
})

/** The first biggest-first tile's width and its digit's font size, in px. */
async function stageTile(page: Page) {
  await page.waitForFunction(() => !!document.querySelector('#sum-biggest [aria-hidden="true"] > span'))
  return page.evaluate(() => {
    const tile = document.querySelector('#sum-biggest [aria-hidden="true"] > span') as HTMLElement
    const digit = tile.querySelector('span') as HTMLElement
    return { tile: +tile.getBoundingClientRect().width.toFixed(1), digit: +getComputedStyle(digit).fontSize.replace('px', '') }
  })
}

test('200% text does not shrink the stage tiles on a narrow phone (WCAG 1.4.4)', async () => {
  // The bug: at 200% text the card subtracted a rem-based operator column, so the tiles and digits got smaller.
  const base = await open('/?n=1234', 320, 653)
  const normal = await stageTile(base)
  await base.context().close()
  const big = await openLargeText('/?n=1234', 320, 653)
  const large = await stageTile(big)
  await big.context().close()
  // Large text must not shrink a tile or a digit by more than a tenth.
  expect({ tileKept: large.tile >= normal.tile * 0.9, digitKept: large.digit >= normal.digit * 0.9 }).toEqual({
    tileKept: true,
    digitKept: true,
  })
})

test('on a 360 px phone every control in the result is at least 44 by 44 px', async () => {
  const page = await open('/?n=2323', 360, 780, { hasTouch: true })
  await page.waitForFunction(() => getComputedStyle(document.querySelector('#end-result')!).opacity === '1', null, { timeout: 15_000 })
  const small = await page.evaluate(() =>
    [...document.querySelectorAll('button, a[href], summary, input, label:has(input[type="radio"])')]
      .map((el) => ({ name: el.id || el.textContent?.trim().slice(0, 12), r: el.getBoundingClientRect() }))
      // Skip visually hidden ones: the skip link and the trail's radios.
      .filter(({ r }) => r.width > 2 && (r.width < 44 || r.height < 44))
      .map(({ name, r }) => `${name} ${Math.round(r.width)}x${Math.round(r.height)}`)
  )
  expect(small).toEqual([])
  await page.context().close()
})

test('the theme toggle sets the browser bar color too', async () => {
  const page = await open('/', 390, 844)
  const barColor = () =>
    page.evaluate(() => [...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')].find((m) => matchMedia(m.media).matches)?.content)
  expect(await barColor()).toBe('#edf8f3')
  await page.locator('#theme-toggle').click()
  expect(await barColor()).toBe('#05100c')
  await page.context().close()
})

test('a new number typed mid-sort keeps every fill inside its tile, and leaves no tile style behind', async () => {
  const page = await open('/?n=2323')
  await page.waitForTimeout(700)
  // 3524 takes 3 steps, so the new run has a step 2 to wait for.
  await page.locator('#number-input').fill('3524')
  // Sample frames: a fill that lost its tile would paint across the page.
  let escaped = 0
  for (let k = 0; k < 20; k++) {
    escaped += await page.evaluate(() => {
      let n = 0
      for (const tile of document.querySelectorAll<HTMLElement>('#stage-sum [aria-hidden="true"] > span')) {
        const t = tile.getBoundingClientRect()
        for (const fill of tile.querySelectorAll(':scope > span:not(:first-child)')) {
          const f = fill.getBoundingClientRect()
          if (f.width > t.width + 1 || f.height > t.height + 1) n++
        }
      }
      return n
    })
    await page.waitForTimeout(80)
  }
  expect(escaped).toBe(0)
  await waitForStep(page, 'Step 2 of 3', 10_000)
  await page.locator('#trail-step-1').click()
  await page.waitForTimeout(1500)
  const styled = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('#stage-sum [aria-hidden="true"] > span')].filter((t) => t.getAttribute('style')).length
  )
  expect(styled).toBe(0)
  await page.context().close()
})

test('the same number again keeps the run, and an unusable ?n= link says why it cannot run', async () => {
  const page = await open('/?n=2323')
  await waitForStep(page, 'Step 2 of 4')
  // A 5th key into the full field: the run goes on.
  await page.locator('#number-input').press('End')
  await page.keyboard.press('5')
  await page.waitForTimeout(200)
  expect(await heading(page)).not.toBe('Step 1 of 4')
  await page.context().close()

  const link = await open('/?n=1111')
  expect(await link.locator('#input-note-title').textContent()).toBe('1111 stops at 0.')
  expect(await link.evaluate(() => location.search)).toBe('')
  await link.context().close()
})

test('a drag during autoplay pauses it and lands on the step it ends on; Escape cancels a drag', async () => {
  const page = await open('/?n=1000', 1440, 900)
  const a = (await page.locator('#trail-step-1').boundingBox())!
  const b = (await page.locator('#trail-step-4').boundingBox())!
  const y = a.y + a.height / 2
  await page.mouse.move(a.x + a.width / 2, y)
  await page.mouse.down()
  await page.mouse.move(b.x + b.width / 2, y, { steps: 20 })
  await page.waitForTimeout(2500)
  await page.mouse.up()
  await waitForStep(page, 'Step 4 of 5', 2000)
  await page.waitForTimeout(3000)
  expect(await heading(page)).toBe('Step 4 of 5')

  // Escape mid-drag: the pill goes back, and the stage stays on the shown step.
  const c = (await page.locator('#trail-step-2').boundingBox())!
  const d = (await page.locator('#trail-step-4').boundingBox())!
  await page.mouse.move(d.x + d.width / 2, y)
  await page.mouse.down()
  await page.mouse.move(c.x + c.width / 2, y, { steps: 10 })
  await page.keyboard.press('Escape')
  await page.mouse.up()
  await page.waitForTimeout(400)
  expect(await heading(page)).toBe('Step 4 of 5')
  await page.context().close()
})

test('forced colors mark the shown trail step with an outline', async () => {
  const page = await open('/?n=2323', 390, 844)
  await page.emulateMedia({ forcedColors: 'active' })
  await page.locator('#trail-step-2').click()
  const outline = await page.locator('#trail .glass-sheen').evaluate((el) => getComputedStyle(el).outlineStyle)
  expect(outline).toBe('solid')
  await page.context().close()
})
