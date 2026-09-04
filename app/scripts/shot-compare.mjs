import { chromium } from '@playwright/test'
const out = process.argv[2]
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)) })
await page.goto('http://localhost:5188/paraiba-atlas/?pilar=gente&camada=gente.renda_per_capita&mun=2507507')
await page.waitForTimeout(4500)
await page.getByRole('button', { name: 'Comparar', exact: true }).click()
await page.mouse.click(300, 400)
await page.waitForTimeout(600)
await page.getByRole('button', { name: 'Comparar', exact: true }).click()
await page.getByRole('button', { name: 'Sertão Paraibano' }).click()
await page.getByRole('button', { name: 'Mata Paraibana' }).click()
await page.waitForTimeout(1200)
await page.screenshot({ path: out })
console.log(page.url(), JSON.stringify(errors))
await browser.close()
