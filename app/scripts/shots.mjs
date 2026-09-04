import { chromium } from '@playwright/test'

const out = process.argv[2] ?? '/tmp'
const base = 'http://localhost:5188/paraiba-atlas/'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto(base)
await page.waitForTimeout(6000)
await page.screenshot({ path: `${out}/01-opening.png` })

await page.getByRole('button', { name: 'Gente' }).click()
await page.getByRole('button', { name: 'População' }).click()
await page.waitForTimeout(3000)
await page.screenshot({ path: `${out}/02-populacao.png` })

await page.mouse.move(520, 430)
await page.waitForTimeout(500)
await page.mouse.click(520, 430)
await page.waitForTimeout(800)
await page.screenshot({ path: `${out}/03-selected.png` })
console.log('url', page.url())
console.log('errors', JSON.stringify(errors.slice(0, 10), null, 1))
await browser.close()
