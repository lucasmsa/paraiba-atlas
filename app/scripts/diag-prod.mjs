import { chromium } from '@playwright/test'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } })
const logs = []
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text().slice(0, 200)}`))
page.on('pageerror', (e) => logs.push(`[pageerror] ${String(e).slice(0, 300)}`))
page.on('requestfailed', (r) => logs.push(`[reqfail] ${r.url().slice(-60)} ${r.failure()?.errorText}`))
page.on('response', (r) => { if (r.status() >= 400) logs.push(`[http ${r.status()}] ${r.url().slice(-60)}`) })
await page.goto(process.argv[2])
await page.waitForTimeout(9000)
const info = await page.evaluate(() => {
  const el = document.querySelector('.maplibregl-canvas')
  const container = document.querySelector('.maplibregl-map')
  return {
    hasMapDiv: !!container,
    containerSize: container ? { w: container.clientWidth, h: container.clientHeight } : null,
    hasCanvas: !!el,
    canvasSize: el ? { w: el.width, h: el.height } : null,
    childCount: container?.children.length ?? 0,
    globalMap: typeof window.__atlasMap,
  }
})
console.log(JSON.stringify(info, null, 1))
console.log(logs.filter(l => !l.includes('GL Driver')).slice(0, 12).join('\n'))
await browser.close()
