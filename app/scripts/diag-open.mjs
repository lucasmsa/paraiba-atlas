import { chromium } from '@playwright/test'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
const page = await ctx.newPage()
await page.goto('http://localhost:5188/paraiba-atlas/')
await page.waitForTimeout(6500)
await page.getByRole('button', { expanded: false }).first().click()
await page.waitForTimeout(1800)
const info = await page.evaluate(() => {
  const m = window.__atlasMap
  const sheet = document.querySelector('[aria-expanded]')?.parentElement
  const sr = sheet?.getBoundingClientRect()
  // where does the state actually land on screen?
  const p1 = m.project([-38.7, -6.0])
  const p2 = m.project([-34.8, -8.3])
  return {
    zoom: +m.getZoom().toFixed(2), padding: m.getPadding(),
    sheetTop: sr ? Math.round(sr.top) : null, sheetH: sr ? Math.round(sr.height) : null,
    stateBox: { x1: Math.round(p1.x), y1: Math.round(p1.y), x2: Math.round(p2.x), y2: Math.round(p2.y) },
  }
})
console.log(JSON.stringify(info, null, 1))
await page.screenshot({ path: process.argv[2] })
await browser.close()
