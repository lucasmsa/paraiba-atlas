import type { ChoroplethLayer } from '../config/layers'

const intFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const decimalFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const indexFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

export function formatValue(value: number, format: ChoroplethLayer['format']): string {
  if (format === 'currency') return currencyFormatter.format(value)
  if (format === 'index') return indexFormatter.format(value)
  if (format === 'percent') return `${decimalFormatter.format(value)}%`
  if (format === 'decimal') return decimalFormatter.format(value)
  return intFormatter.format(value)
}
