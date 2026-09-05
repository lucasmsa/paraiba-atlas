import { chromium } from '@playwright/test'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
const page = await ctx.newPage()
let renders = 0
page.on('console', (m) => { if (m.text().includes('render')) renders++ })
await page.goto('http://localhost:5188/paraiba-atlas/')
await page.waitForTimeout(6500)
const cam = async (l) => console.log(l, JSON.stringify(await page.evaluate(() => {
  const m = window.__atlasMap
  const c = m.getCenter()
  return { lng: +c.lng.toFixed(3), lat: +c.lat.toFixed(3), zoom: +m.getZoom().toFixed(2), pitch: Math.round(m.getPitch()), padding: m.getPadding(), moving: m.isMoving() }
})))
await cam('closed')
await page.getByRole('button', { expanded: false }).first().click()
await page.waitForTimeout(1600)
await cam('opened')
await browser.close()
