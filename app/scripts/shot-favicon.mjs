import { chromium } from '@playwright/test'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 420, height: 260 } })
await page.setContent(`<body style="margin:0;background:#2a2724;display:flex;align-items:center;gap:26px;padding:24px;font:13px system-ui;color:#efe9df">
  <div style="text-align:center"><img src="${process.argv[2]}" width="16" height="16" style="image-rendering:auto"><div style="margin-top:6px">16</div></div>
  <div style="text-align:center"><img src="${process.argv[2]}" width="32" height="32"><div style="margin-top:6px">32</div></div>
  <div style="text-align:center"><img src="${process.argv[2]}" width="64" height="64"><div style="margin-top:6px">64</div></div>
  <div style="text-align:center"><img src="${process.argv[2]}" width="128" height="128"><div style="margin-top:6px">128</div></div>
</body>`)
await page.waitForTimeout(900)
await page.screenshot({ path: process.argv[3] })
await browser.close()
