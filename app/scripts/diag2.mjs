import { chromium } from '@playwright/test'
const url = process.argv[2]
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const logs = []
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text().slice(0, 260)}`))
page.on('pageerror', (e) => logs.push(`[pageerror] ${String(e).slice(0, 260)}`))
page.on('requestfailed', (r) => logs.push(`[reqfail] ${r.url().slice(-70)} ${r.failure()?.errorText}`))
page.on('response', (r) => { if (r.status() >= 400) logs.push(`[http ${r.status()}] ${r.url().slice(-70)}`) })
await page.goto(url)
await page.waitForTimeout(8000)
const info = await page.evaluate(() => {
  const m = window.__atlasMap
  if (!m) return { map: null }
  return {
    loaded: m.loaded(), styleLoaded: m.isStyleLoaded(),
    layers: m.getStyle()?.layers?.filter(l => l.id.startsWith('atlas')).map(l => l.id) ?? [],
    hasPointSrc: !!m.getSource('atlas-points'),
    center: m.getCenter(), zoom: Math.round(m.getZoom()*10)/10,
    canvas: (() => { const c = document.querySelector('.maplibregl-canvas'); return c ? {w:c.width,h:c.height} : null })(),
  }
})
console.log(JSON.stringify(info, null, 1))
console.log(logs.filter(l => !l.includes('GL Driver')).slice(0, 14).join('\n'))
await browser.close()
