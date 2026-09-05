import { chromium, devices } from '@playwright/test'
const url = process.argv[2]
const out = process.argv[3]
const browser = await chromium.launch()
for (const [name, vp] of [['iphone', { width: 390, height: 844 }], ['small', { width: 360, height: 740 }], ['tablet', { width: 768, height: 1024 }]]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  const page = await ctx.newPage()
  await page.goto(url)
  await page.waitForTimeout(6500)
  const m = await page.evaluate(() => ({
    bodyScrollW: document.body.scrollWidth,
    innerW: window.innerWidth,
    horizontalOverflow: document.body.scrollWidth > window.innerWidth,
    mapW: document.querySelector('.maplibregl-map')?.clientWidth,
    sidebarW: document.querySelector('.cordel-papel')?.clientWidth,
  }))
  console.log(name, JSON.stringify(m))
  await page.screenshot({ path: out.replace('.png', `-${name}.png`) })
  await ctx.close()
}
await browser.close()
