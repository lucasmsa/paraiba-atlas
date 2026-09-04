export type PillarId = 'terra' | 'agua' | 'gente'

export interface Pillar {
  id: PillarId
  label: string
  accent: string
  ramp: string[]
}

export const PILLARS: Pillar[] = [
  { id: 'terra', label: 'Terra', accent: '#8a4b12', ramp: ['#f6e8d3', '#e5c08e', '#cf9455', '#b0672a', '#7d4212'] },
  { id: 'agua', label: 'Água', accent: '#1e5f66', ramp: ['#dcefe9', '#a8d5cc', '#6fb6b0', '#3a8f93', '#1f5f6b'] },
  { id: 'gente', label: 'Gente', accent: '#9b2f1f', ramp: ['#f3dcd3', '#e4b39f', '#cf8468', '#b2543a', '#7f2a1b'] },
]
