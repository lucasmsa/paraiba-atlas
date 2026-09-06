import { chromium } from '@playwright/test'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push(String(e).slice(0, 160)))
await page.goto('http://localhost:5188/paraiba-atlas/?pilar=gente&camada=gente.renda_per_capita')
await page.waitForTimeout(6500)
// Put the target in the upper map band, which is what a thumb can reach with panels open.
const clickAt = async (lng, lat) => {
  await page.evaluate(([lo, la]) => window.__atlasMap.easeTo({ center: [lo, la], zoom: 9, duration: 0 }), [lng, lat])
  await page.waitForTimeout(900)
  const pt = await page.evaluate(([lo, la]) => {
    const m = window.__atlasMap
    const p = m.project([lo, la])
    m.panBy([0, p.y - 140], { duration: 0 })
    return m.project([lo, la])
  }, [lng, lat])
  await page.mouse.click(Math.round(pt.x), Math.round(pt.y))
  await page.waitForTimeout(900)
}
await clickAt(-34.861, -7.115)
await page.getByRole('button', { name: 'Comparar', exact: true }).click()
await page.waitForTimeout(400)
await clickAt(-36.288, -7.489)
await page.getByRole('button', { name: 'Comparar', exact: true }).click()
await page.waitForTimeout(1200)
const rects = await page.evaluate(() => [...document.querySelectorAll('section.cordel-bloco')].map(el => {
  const r = el.getBoundingClientRect()
  return { t: el.querySelector('h2')?.textContent, y: Math.round(r.y), h: Math.round(r.h ?? r.height), bottom: Math.round(r.bottom) }
}))
console.log('panels:', JSON.stringify(rects), 'viewport 844')
console.log('errors:', JSON.stringify(errs))
await page.screenshot({ path: process.argv[2] })
await browser.close()
