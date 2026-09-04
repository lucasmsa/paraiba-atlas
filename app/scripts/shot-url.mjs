import { chromium } from '@playwright/test'
const [url, out, h] = process.argv.slice(2)
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: Number(h) || 1100 } })
await page.goto(url)
await page.waitForTimeout(3500)
await page.screenshot({ path: out, fullPage: true })
await browser.close()
