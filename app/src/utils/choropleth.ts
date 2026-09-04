import type { ExpressionSpecification } from 'maplibre-gl'
import type { Metric } from '../data/contract'

export const NO_DATA_COLOR = '#d9d4cc'

const value: ExpressionSpecification = ['coalesce', ['feature-state', 'value'], -1]
export const hasValue: ExpressionSpecification = ['>=', value, 0]

export function fillColorExpression(metric: Metric, ramp: string[]): ExpressionSpecification {
  const step: ExpressionSpecification = ['step', value, ramp[0]]
  metric.breaks.forEach((edge, i) => step.push(edge, ramp[i + 1]))
  return ['case', hasValue, step, NO_DATA_COLOR]
}
