import { chromium } from '@playwright/test'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)))
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)) })
await page.goto('http://localhost:5188/paraiba-atlas/')
await page.waitForTimeout(6500)
const snap = async (label) => {
  const d = await page.evaluate(() => {
    const c = document.querySelector('.maplibregl-canvas')
    const m = document.querySelector('.maplibregl-map')
    const r = c?.getBoundingClientRect()
    return {
      canvasAttr: c ? { w: c.width, h: c.height } : null,
      canvasCss: r ? { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top) } : null,
      mapCss: m ? { w: m.clientWidth, h: m.clientHeight } : null,
    }
  })
  console.log(label, JSON.stringify(d))
}
await snap('closed ')
await page.getByRole('button', { expanded: false }).first().click()
await page.waitForTimeout(1400)
await snap('opened ')
console.log('errors:', JSON.stringify(errs.slice(0, 4)))
await browser.close()
