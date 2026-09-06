import { chromium } from '@playwright/test'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
const page = await ctx.newPage()
await page.goto('http://localhost:5188/paraiba-atlas/?pilar=gente&camada=gente.renda_per_capita')
await page.waitForTimeout(6500)
await page.evaluate(() => window.__atlasMap.easeTo({ center: [-34.861, -7.115], zoom: 9, duration: 0 }))
await page.waitForTimeout(900)
const pt = await page.evaluate(() => window.__atlasMap.project([-34.861, -7.115]))
await page.mouse.click(pt.x, pt.y)
await page.waitForTimeout(1200)
const info = await page.evaluate(() => {
  const secs = [...document.querySelectorAll('section.cordel-bloco')].map(el => {
    const r = el.getBoundingClientRect()
    return { t: el.querySelector('h2')?.textContent, y: Math.round(r.y), h: Math.round(r.height) }
  })
  const btns = [...document.querySelectorAll('button')].map(b => b.textContent.trim()).filter(t => t.includes('Compar'))
  return { secs, btns }
})
console.log(JSON.stringify(info))
await page.screenshot({ path: process.argv[2] })
await browser.close()
