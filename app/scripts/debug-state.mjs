import { chromium } from '@playwright/test'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const logs = []
page.on('pageerror', (e) => logs.push(`[pageerror] ${String(e).slice(0, 300)}`))
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text().slice(0, 300)}`) })
page.on('response', (r) => { if (r.status() >= 400) logs.push(`[http ${r.status()}] ${r.url().slice(0, 140)}`) })
await page.goto('http://localhost:5188/paraiba-atlas/?pilar=gente&camada=gente.renda_per_capita&mun=2507507')
await page.waitForTimeout(5000)
const buttons = await page.getByRole('button').allTextContents()
console.log('buttons:', JSON.stringify(buttons))
console.log(logs.join('\n'))
await page.screenshot({ path: '/private/tmp/claude-501/-Users-lucasmoreira-Main-personal/5301a309-4230-45fa-b3b1-531b9e900d1b/scratchpad/07-debug.png' })
await browser.close()
