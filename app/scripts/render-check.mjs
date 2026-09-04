import { chromium } from '@playwright/test'
const browser = await chromium.launch()
for (const run of [1, 2, 3]) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 700 } })
  await page.goto(process.argv[2])
  await page.waitForTimeout(7000)
  // sample the map canvas: a rendered map has many distinct colors, a blank one has ~1
  const stats = await page.evaluate(() => {
    const c = document.querySelector('.maplibregl-canvas')
    if (!c) return null
    const gl = c.getContext('webgl2') || c.getContext('webgl')
    const px = new Uint8Array(4 * 200 * 200)
    gl.readPixels(300, 200, 200, 200, gl.RGBA, gl.UNSIGNED_BYTE, px)
    const seen = new Set()
    for (let i = 0; i < px.length; i += 4) seen.add(`${px[i]},${px[i+1]},${px[i+2]}`)
    return { distinctColors: seen.size, terrain: !!window.__atlasMap?.getTerrain() }
  })
  console.log(`run ${run}:`, JSON.stringify(stats))
  await page.close()
}
await browser.close()
