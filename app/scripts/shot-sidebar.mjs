import { chromium } from '@playwright/test'
const [url, out] = process.argv.slice(2)
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(url)
await page.waitForTimeout(6000)
const sb = page.locator('aside, .cordel-papel').first()
await sb.screenshot({ path: out })
await browser.close()
