import { chromium } from '@playwright/test'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } })
const errs = []
page.on('pageerror', (e) => errs.push(String(e).slice(0, 160)))
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)) })
await page.goto('http://localhost:5188/paraiba-atlas/?pilar=gente&camada=gente.renda_per_capita')
await page.waitForTimeout(6500)

const clickAt = async (lng, lat) => {
  await page.evaluate(([lo, la]) => window.__atlasMap.easeTo({ center: [lo, la], zoom: 9, duration: 0 }), [lng, lat])
  await page.waitForTimeout(900)
  const pt = await page.evaluate(([lo, la]) => window.__atlasMap.project([lo, la]), [lng, lat])
  await page.mouse.click(pt.x, pt.y)
  await page.waitForTimeout(800)
}
// João Pessoa, then Cabaceiras: add both to compare
await clickAt(-34.861, -7.115)
await page.getByRole('button', { name: 'Comparar', exact: true }).click()
await page.waitForTimeout(500)
await clickAt(-36.288, -7.489)
const secondBtn = page.getByRole('button', { name: 'Comparar', exact: true })
console.log('second Comparar visible:', await secondBtn.isVisible())
await secondBtn.click()
await page.waitForTimeout(1200)

const rects = await page.evaluate(() => [...document.querySelectorAll('section.cordel-bloco')].map(el => {
  const r = el.getBoundingClientRect()
  return { title: el.querySelector('h2')?.textContent, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }
}))
console.log('panels:', JSON.stringify(rects))
const overlap = (a, b) => !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y)
let bad = []
for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) if (overlap(rects[i], rects[j])) bad.push([rects[i].title, rects[j].title])
console.log('overlaps:', JSON.stringify(bad))
console.log('errors:', JSON.stringify(errs.slice(0, 3)))
await page.screenshot({ path: process.argv[2] })
await browser.close()
