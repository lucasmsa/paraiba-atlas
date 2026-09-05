import { chromium } from '@playwright/test'
const browser = await chromium.launch()
for (const [label, opts] of [
  ['mobile-emul', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }],
  ['plain-small', { viewport: { width: 390, height: 844 } }],
]) {
  const ctx = await browser.newContext(opts)
  const page = await ctx.newPage()
  await page.goto('http://localhost:5188/paraiba-atlas/')
  await page.waitForTimeout(6000)
  await page.getByRole('button', { expanded: false }).first().click()
  await page.waitForTimeout(1500)
  // nudge the map so it must repaint a fresh frame
  await page.evaluate(() => window.__atlasMap.panBy([0, 1], { duration: 0 }))
  await page.waitForTimeout(700)
  await page.screenshot({ path: process.argv[2].replace('.png', `-${label}.png`) })
  console.log(label, 'shot')
  await ctx.close()
}
await browser.close()
