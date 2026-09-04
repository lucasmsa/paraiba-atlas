import { chromium } from '@playwright/test'
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const logs = []
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text().slice(0, 200)}`))
page.on('pageerror', (e) => logs.push(`[pageerror] ${e}`))
page.on('requestfailed', (r) => logs.push(`[reqfail] ${r.url().slice(0, 120)} ${r.failure()?.errorText}`))
page.on('response', (r) => { if (r.status() >= 400) logs.push(`[http ${r.status()}] ${r.url().slice(0, 120)}`) })
await page.goto('http://localhost:5188/paraiba-atlas/')
await page.waitForTimeout(8000)
const info = await page.evaluate(() => {
  const c = document.querySelector('.maplibregl-canvas')
  const gl = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl')
  return { canvas: c ? { w: c.width, h: c.height, cw: c.clientWidth, ch: c.clientHeight } : null, webgl: !!gl, root: document.getElementById('root')?.clientHeight, mapDiv: document.querySelector('.maplibregl-map')?.className }
})
console.log(JSON.stringify(info))
console.log(logs.slice(0, 25).join('\n'))
await page.screenshot({ path: '/private/tmp/claude-501/-Users-lucasmoreira-Main-personal/5301a309-4230-45fa-b3b1-531b9e900d1b/scratchpad/04-diag.png' })
await browser.close()
