import { chromium } from '@playwright/test'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
const page = await ctx.newPage()
await page.goto('http://localhost:5188/paraiba-atlas/')
await page.waitForTimeout(6000)
const measure = () => page.evaluate(() => {
  const h = (sel) => { const e = document.querySelector(sel); return e ? Math.round(e.getBoundingClientRect().height) : null }
  const c = document.querySelector('.maplibregl-canvas')
  return {
    win: window.innerHeight, docEl: document.documentElement.clientHeight, body: h('body'),
    root: h('#root'), main: h('main'), mapWrap: h('.absolute.inset-0'), mapDiv: h('.maplibregl-map'),
    canvasAttrH: c?.height, canvasCssH: Math.round(c?.getBoundingClientRect().height),
  }
})
console.log('closed', JSON.stringify(await measure()))
await page.getByRole('button', { expanded: false }).first().click()
await page.waitForTimeout(1600)
console.log('opened', JSON.stringify(await measure()))
await browser.close()
