import { chromium } from '@playwright/test'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
const errs = []
page.on('pageerror', (e) => errs.push(String(e).slice(0, 160)))
await page.goto('http://localhost:5188/paraiba-atlas/?pilar=terra')
await page.waitForTimeout(6000)
await page.getByRole('button', { name: 'Sobre o atlas e as fontes' }).click()
await page.waitForTimeout(1200)
await page.locator('article').first().screenshot({ path: process.argv[2] })
console.log('errors:', JSON.stringify(errs))
await browser.close()
