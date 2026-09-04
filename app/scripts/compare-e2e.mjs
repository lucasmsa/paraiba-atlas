import { chromium } from '@playwright/test'
const B = 'http://localhost:5188/paraiba-atlas/'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
const errs = []
page.on('pageerror', (e) => errs.push(String(e).slice(0, 160)))
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)) })

await page.goto(`${B}?pilar=gente&camada=gente.renda_per_capita`)
await page.waitForTimeout(6500)

// select João Pessoa and Cabaceiras by coordinate, adding each to compare
const picks = [[-34.861, -7.115], [-36.288, -7.489]]
for (const [lng, lat] of picks) {
  await page.evaluate(([lo, la]) => window.__atlasMap?.easeTo({ center: [lo, la], zoom: 9, duration: 0 }), [lng, lat])
  await page.waitForTimeout(1200)
  const pt = await page.evaluate(([lo, la]) => window.__atlasMap?.project([lo, la]), [lng, lat])
  await page.mouse.click(pt.x, pt.y)
  await page.waitForTimeout(900)
  const btn = page.getByRole('button', { name: 'Comparar', exact: true })
  if (await btn.count()) { await btn.click(); await page.waitForTimeout(400) }
}
// add two mesorregiões
for (const nome of ['Sertão Paraibano', 'Mata Paraibana']) {
  const b = page.getByRole('button', { name: nome, exact: true })
  if (await b.count()) { await b.click(); await page.waitForTimeout(300) }
}
await page.waitForTimeout(1500)
const url = page.url()
const table = page.locator('section[aria-label="Comparação"]')
const rows = await table.locator('tbody tr').count()
const heads = await table.locator('thead th').allTextContents()
const best = await table.locator('td.bg-emerald-100').count()
const worst = await table.locator('td.bg-rose-100').count()
const nodata = await table.locator('td', { hasText: 'sem dados' }).count()
console.log(JSON.stringify({ url, rows, heads: heads.map(h => h.trim().replace(/\s+/g,' ')), best, worst, nodata, errs: errs.slice(0,3) }))
await table.screenshot({ path: '/private/tmp/claude-501/-Users-lucasmoreira-Main-personal/e707289f-48e4-4f31-92e8-bc701cb24ffd/scratchpad/80-compare.png' })
await browser.close()
