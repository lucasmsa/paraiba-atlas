import { chromium } from '@playwright/test'
const [url, out] = process.argv.slice(2)
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)))
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)) })
page.on('response', (r) => { if (r.status() >= 400) errors.push(`http ${r.status()} ${r.url().slice(-60)}`) })
await page.goto(url)
await page.waitForTimeout(7000)
await page.screenshot({ path: out })
console.log(JSON.stringify(errors.slice(0, 6)))
await browser.close()
