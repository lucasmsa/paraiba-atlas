import { chromium } from '@playwright/test'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
const page = await ctx.newPage()
await page.goto('http://localhost:5188/paraiba-atlas/')
await page.waitForTimeout(6500)
await page.getByRole('button', { expanded: false }).first().click()
await page.waitForTimeout(1600)
const probe = await page.evaluate(() => {
  const out = []
  for (const y of [80, 200, 280, 320, 450, 600]) {
    const els = document.elementsFromPoint(195, y).slice(0, 3).map(e => `${e.tagName}.${(e.className || '').toString().slice(0, 40)}`)
    out.push({ y, els })
  }
  const m = window.__atlasMap
  return { probe: out, canvas: (() => { const c = document.querySelector('.maplibregl-canvas'); return { w: c.width, h: c.height, style: c.style.cssText.slice(0,80) } })() }
})
console.log(JSON.stringify(probe, null, 1))
await browser.close()
