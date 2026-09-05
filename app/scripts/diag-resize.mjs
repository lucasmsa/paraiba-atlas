import { chromium } from '@playwright/test'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
const page = await ctx.newPage()
await page.goto('http://localhost:5188/paraiba-atlas/')
await page.waitForTimeout(6000)
const internals = () => page.evaluate(() => {
  const m = window.__atlasMap
  const keys = Object.keys(m).filter(k => /transform|_tr\b/i.test(k))
  const t = m.transform ?? m._tr ?? m.style?.map?.transform
  return { keys: keys.slice(0, 6), trW: t?.width, trH: t?.height, painterW: m.painter?.width, painterH: m.painter?.height }
})
console.log('before open', JSON.stringify(await internals()))
await page.getByRole('button', { expanded: false }).first().click()
await page.waitForTimeout(1500)
console.log('after open ', JSON.stringify(await internals()))
await page.evaluate(() => window.__atlasMap.resize())
await page.waitForTimeout(1200)
console.log('after resize', JSON.stringify(await internals()))
await page.screenshot({ path: process.argv[2] })
await browser.close()
