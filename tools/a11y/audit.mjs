// Accessibility + UX audit of the running app.
//
//   cd tools/a11y && npm install && npm run audit
//   BASE_URL=http://localhost:5176 npm run audit -- /szukaj /miejsce/5   # other port, selected routes
//
// Checks every route at 390 px (phone), 320 px (= 200% zoom reflow, WCAG 1.4.10) and 1280 px:
//   - axe-core: WCAG 2.0/2.1/2.2 A + AA rules and best practices
//   - exactly one <h1>, no skipped heading levels, non-empty <title>
//   - no horizontal page scroll at 320 px
//   - interactive elements at least 44x44 px (inline text links excluded)
//   - first Tab goes to the "Przejdź do treści" skip link
// Exit code 1 if anything fails. Uses your installed Chrome (set CHROME_PATH if not found).
import fs from 'node:fs'
import { createRequire } from 'node:module'
import puppeteer from 'puppeteer-core'

const require = createRequire(import.meta.url)
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8')
const BASE = process.env.BASE_URL || 'http://localhost:5173'
const CHROME = process.env.CHROME_PATH || [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].find((p) => fs.existsSync(p))

const ALL_ROUTES = ['/', '/szukaj', '/szukaj?q=muzeum', '/miejsce/5', '/miejsce/5/historia', '/trasa', '/moje-potrzeby', '/zglos',
  '/zglos?place=5&parameter=threshold_cm', '/jak-to-dziala', '/dane', '/dla-firm', '/dla-miast', '/faq', '/dostepnosc',
  '/prywatnosc', '/regulamin', '/licencje', '/widget/5', '/nie-ma-takiej-strony']
const routes = process.argv.slice(2).length ? process.argv.slice(2) : ALL_ROUTES
const VIEWPORTS = [
  { name: 'phone 390', width: 390, height: 844, isMobile: true },
  { name: 'zoom 320', width: 320, height: 640, isMobile: true },
  { name: 'desktop', width: 1280, height: 800, isMobile: false },
]

if (!CHROME) { console.error('Chrome not found - set CHROME_PATH'); process.exit(2) }
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true })
let failures = 0

for (const vp of VIEWPORTS) {
  const page = await browser.newPage()
  await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile, hasTouch: vp.isMobile })
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }])
  for (const route of routes) {
    await page.goto(BASE + route, { waitUntil: 'networkidle0' })
    await new Promise((r) => setTimeout(r, 800))
    const problems = []

    if (vp.name !== 'zoom 320') {
      await page.evaluate(axeSource)
      const violations = await page.evaluate(async () => (await window.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
      })).violations.map((v) => `axe ${v.id} (${v.impact}): ${v.help} -> ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(', ')}`))
      problems.push(...violations)
    }

    problems.push(...await page.evaluate((isZoom) => {
      const out = []
      const visible = (e) => e.offsetParent !== null || getComputedStyle(e).position === 'fixed'
      const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(visible)
      const h1 = hs.filter((h) => h.tagName === 'H1').length
      if (h1 !== 1) out.push(`page has ${h1} <h1> (expected 1)`)
      for (let i = 1; i < hs.length; i++) {
        const a = +hs[i - 1].tagName[1], b = +hs[i].tagName[1]
        if (b > a + 1) out.push(`heading level skipped: h${a} "${hs[i - 1].textContent.trim().slice(0, 30)}" -> h${b} "${hs[i].textContent.trim().slice(0, 30)}"`)
      }
      if (!document.title.trim()) out.push('empty <title>')
      if (isZoom && document.documentElement.scrollWidth > window.innerWidth + 1) {
        out.push(`horizontal scroll at 320 px (page is ${document.documentElement.scrollWidth} px wide)`)
      }
      const small = [...document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=switch]')]
        .filter((e) => visible(e) && !e.closest('.leaflet-container') && !e.classList.contains('skip-link') && !e.classList.contains('visually-hidden'))
        .filter((e) => !(e.tagName === 'A' && getComputedStyle(e).display === 'inline'))
        .filter((e) => {
          // a small checkbox/radio is fine when its whole <label> is the target
          const target = (e.matches('input[type=checkbox],input[type=radio]') && e.closest('label')) || e
          const r = target.getBoundingClientRect()
          return r.width < 44 || r.height < 44
        })
      for (const e of small.slice(0, 5)) {
        const r = e.getBoundingClientRect()
        out.push(`small target ${Math.round(r.width)}x${Math.round(r.height)} px: <${e.tagName.toLowerCase()}> "${(e.textContent || e.getAttribute('aria-label') || e.name || '').trim().slice(0, 30)}"`)
      }
      if (small.length > 5) out.push(`... and ${small.length - 5} more small targets`)
      return out
    }, vp.name === 'zoom 320'))

    if (vp.name === 'desktop' && !route.startsWith('/widget')) {
      await page.keyboard.press('Tab')
      const first = await page.evaluate(() => document.activeElement?.textContent?.trim())
      if (first !== 'Przejdź do treści') problems.push(`first Tab focuses "${first}" instead of the skip link`)
    }

    const tag = `[${vp.name}] ${route}`
    if (problems.length) {
      failures += problems.length
      console.log(`FAIL ${tag}`)
      for (const p of problems) console.log(`     - ${p}`)
    } else {
      console.log(`ok   ${tag}`)
    }
  }
  await page.close()
}
await browser.close()
console.log(failures ? `\n${failures} problem(s) found` : '\nAll checks passed')
process.exit(failures ? 1 : 0)
