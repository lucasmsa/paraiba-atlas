import { chromium } from '@playwright/test'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } })
const reqs = []
page.on('request', (r) => reqs.push(r.url()))
await page.goto(process.argv[2])
await page.waitForTimeout(9000)
const group = (pred) => reqs.filter(pred).length
console.log(JSON.stringify({
  total: reqs.length,
  styleJson: group(u => u.includes('openfreemap') && u.includes('styles')),
  tiles: group(u => u.includes('.pbf') || u.includes('openfreemap') && u.includes('tiles')),
  glyphs: group(u => u.includes('fonts') || u.includes('.pbf') && u.includes('glyph')),
  terrain: group(u => u.includes('elevation-tiles')),
  ourData: group(u => u.includes('/data/')),
  workerFile: group(u => u.includes('worker')),
}, null, 1))
console.log('sample non-data requests:')
console.log([...new Set(reqs.filter(u => !u.includes('/data/')))].slice(0, 12).map(u => u.slice(0, 95)).join('\n'))
await browser.close()
