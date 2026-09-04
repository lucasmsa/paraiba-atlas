import { chromium } from '@playwright/test'
const files = process.argv.slice(3)
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 560, height: 130 * files.length + 20 } })
const row = (f) => `<div style="display:flex;align-items:center;gap:22px;padding:10px 20px">
  <div style="width:120px;font:12px system-ui;color:#efe9df">${f.split('/').pop()}</div>
  ${[16,24,32,64,110].map(s => `<div style="text-align:center"><img src="${f}" width="${s}" height="${s}"><div style="margin-top:4px;font:10px system-ui;color:#a89e91">${s}</div></div>`).join('')}
</div>`
await page.setContent(`<body style="margin:0;background:#2a2724">${files.map(row).join('')}</body>`)
await page.waitForTimeout(1200)
await page.screenshot({ path: process.argv[2] })
await browser.close()
