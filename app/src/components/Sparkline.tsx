import type { SeriePoint } from '../utils/sparkline'
import { sparkPath } from '../utils/sparkline'

interface Props {
  serie: SeriePoint[]
  color: string
}

const WIDTH = 200
const HEIGHT = 58
const GRID = [
  { percent: 100, label: 'cheio' },
  { percent: 50, label: 'metade' },
]

export function Sparkline({ serie, color }: Props) {
  const path = sparkPath(serie, WIDTH, HEIGHT)
  if (!path) return <p className="text-sm text-tinta-fraca">Série mensal insuficiente para desenhar.</p>

  const months = serie.filter((point) => point.percentual !== null)
  const first = months[0]
  const last = months[months.length - 1]

  return (
    <figure className="m-0 flex flex-col gap-1">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" height={HEIGHT} role="img" aria-label={`Volume de ${first.mes} a ${last.mes}, ${last.percentual}% no fim`}>
        {GRID.map(({ percent, label }) => {
          const y = HEIGHT - (percent / 100) * HEIGHT
          return (
            <g key={percent}>
              <line x1="0" y1={y} x2={WIDTH} y2={y} stroke="#17120e" strokeWidth="1" opacity="0.2" strokeDasharray="3 3" />
              <text x={WIDTH} y={percent === 100 ? y + 9 : y - 3} textAnchor="end" fontSize="9" fill="#4a3f33" opacity="0.85">
                {label}
              </text>
            </g>
          )
        })}
        <line x1="0" y1={HEIGHT} x2={WIDTH} y2={HEIGHT} stroke="#17120e" strokeWidth="1" opacity="0.45" />
        <path d={path.area} fill={color} opacity="0.22" />
        <path d={path.line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {path.last && <circle cx={path.last.x} cy={path.last.y} r="2.8" fill={color} stroke="#f3e8d2" strokeWidth="0.8" />}
      </svg>
      <figcaption className="flex justify-between text-sm text-tinta-fraca">
        <span>{first.mes}</span>
        <span>
          {path.filled} de {serie.length} meses
        </span>
        <span>{last.mes}</span>
      </figcaption>
    </figure>
  )
}
