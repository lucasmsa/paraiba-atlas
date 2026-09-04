import { chromium } from '@playwright/test'
const B = 'http://localhost:5188/paraiba-atlas/'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const problems = []
page.on('pageerror', (e) => problems.push(`pageerror ${String(e).slice(0, 120)}`))
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console ${m.text().slice(0, 120)}`) })
page.on('response', (r) => { if (r.status() >= 400) problems.push(`http ${r.status()} ${r.url().split('/').slice(-2).join('/')}`) })

await page.goto(B)
await page.waitForTimeout(5000)

const pillars = ['Terra', 'Água', 'Gente']
const results = []
for (const p of pillars) {
  await page.getByRole('button', { name: p, exact: true }).click()
  await page.waitForTimeout(400)
  const buttons = page.locator('ul li button')
  const count = await buttons.count()
  for (let i = 0; i < count; i++) {
    const btn = buttons.nth(i)
    const label = (await btn.locator('span').first().textContent())?.trim() ?? '?'
    await btn.click()
    await page.waitForTimeout(1800)
    const cardTitle = await page.locator('article h2').first().textContent().catch(() => null)
    const legendItems = await page.locator('ol[aria-label="Legenda"] li').count().catch(() => 0)
    results.push({ pillar: p, label, card: cardTitle?.trim() ?? null, legend: legendItems })
    await btn.click()
    await page.waitForTimeout(300)
  }
}
console.log(JSON.stringify(results, null, 0))
console.log('PROBLEMS:', problems.length ? JSON.stringify([...new Set(problems)]) : 'none')
await browser.close()
