import { chromium } from '@playwright/test'
const [url, out] = process.argv.slice(2)
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(url)
await page.waitForTimeout(7000)
// click the Pedra da Boca point: project its lng/lat through the map
const pt = await page.evaluate(() => {
  const m = window.__atlasMap
  return m ? m.project([-35.6752, -6.456]) : null
})
if (pt) { await page.mouse.click(pt.x, pt.y); await page.waitForTimeout(900) }
await page.screenshot({ path: out })
console.log('clicked at', JSON.stringify(pt))
await browser.close()
