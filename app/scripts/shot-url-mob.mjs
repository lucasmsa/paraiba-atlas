import { chromium } from '@playwright/test'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push(String(e).slice(0, 160)))
await page.goto(process.argv[2])
await page.waitForTimeout(7000)
const rects = await page.evaluate(() => [...document.querySelectorAll('section.cordel-bloco')].map(el => {
  const r = el.getBoundingClientRect()
  return { t: el.querySelector('h2')?.textContent, y: Math.round(r.y), bottom: Math.round(r.bottom) }
}))
console.log('panels:', JSON.stringify(rects), 'errors:', JSON.stringify(errs))
await page.screenshot({ path: process.argv[3] })
await browser.close()
