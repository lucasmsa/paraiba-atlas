export function hatchImage(size = 12, stroke = '#8b857c'): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#efeae2'
  ctx.fillRect(0, 0, size, size)
  ctx.strokeStyle = stroke
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(0, size)
  ctx.lineTo(size, 0)
  ctx.moveTo(-size / 2, size / 2)
  ctx.lineTo(size / 2, -size / 2)
  ctx.moveTo(size / 2, size * 1.5)
  ctx.lineTo(size * 1.5, size / 2)
  ctx.stroke()
  return ctx.getImageData(0, 0, size, size)
}
