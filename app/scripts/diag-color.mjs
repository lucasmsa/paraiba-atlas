import { chromium } from '@playwright/test'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
const page = await ctx.newPage()
await page.goto('http://localhost:5188/paraiba-atlas/')
await page.waitForTimeout(6000)
await page.getByRole('button', { expanded: false }).first().click()
await page.waitForTimeout(1600)
const shot = await page.screenshot()
const png = shot
// decode PNG minimally via the browser
const b64 = png.toString('base64')
const colors = await page.evaluate(async (data) => {
  const img = new Image()
  img.src = 'data:image/png;base64,' + data
  await img.decode()
  const c = document.createElement('canvas')
  c.width = img.width; c.height = img.height
  const ctx = c.getContext('2d')
  ctx.drawImage(img, 0, 0)
  const at = (x, y) => { const d = ctx.getImageData(x, y, 1, 1).data; return `#${[d[0],d[1],d[2]].map(v=>v.toString(16).padStart(2,'0')).join('')}` }
  return { y60: at(195,60), y150: at(195,150), y280: at(195,280), y320: at(195,320), y450: at(195,450), y600: at(195,600), size: [img.width, img.height] }
}, b64)
console.log(JSON.stringify(colors))
console.log('papel #f3e8d2 | papel-fundo #e7d9bd')
await browser.close()
