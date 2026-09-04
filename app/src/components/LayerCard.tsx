import type { AtlasLayer } from '../config/layers'
import type { Metric, ManifestLayer } from '../data/contract'
import type { ClassEntry, ClassLabel } from '../data/classes'
import { Legend } from './Legend'
import { ClassLegend } from './ClassLegend'

interface Props {
  layer: AtlasLayer
  metric: Metric | null
  entries: ClassEntry[] | null
  colors: Record<string, string>
  labels: Record<string, ClassLabel>
  provenance: ManifestLayer | null
  ramp: string[]
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-1">
      <h3 className="font-display text-[13px] uppercase leading-none text-tinta">{title}</h3>
      <div className="text-base leading-relaxed text-tinta">{children}</div>
    </section>
  )
}

function subtitleFor(layer: AtlasLayer, metric: Metric | null, provenance: ManifestLayer | null): string | null {
  if (layer.kind === 'choropleth' && metric) return `${metric.unit}, ${metric.year}`
  if (!provenance) return null
  return layer.kind === 'points' ? `${provenance.rows} registros, ${provenance.year}` : String(provenance.year)
}

export function LayerCard({ layer, metric, entries, colors, labels, provenance, ramp }: Props) {
  const subtitle = subtitleFor(layer, metric, provenance)
  return (
    <article className="cordel-bloco cordel-sombra flex flex-col gap-4 p-4">
      <header>
        <h2 className="cordel-titulo text-[26px] text-tinta">{layer.label}</h2>
        {subtitle && <p className="mt-0.5 text-base text-tinta-fraca">{subtitle}</p>}
      </header>
      <Section title="O que é">{layer.card.oQueE}</Section>
      <Section title="Por que importa">{layer.card.porQueImporta}</Section>
      <Section title="Como ler">
        <p className="mb-2">{layer.card.comoLer}</p>
        {layer.kind === 'choropleth' && metric && <Legend metric={metric} ramp={ramp} format={layer.format} />}
        {layer.kind === 'categorical' && entries && <ClassLegend entries={entries} colors={colors} labels={labels} />}
        {layer.kind === 'points' && (
          <p className="flex items-center gap-2.5">
            <span className="inline-block h-4 w-4 rounded-full border border-papel" style={{ background: layer.color }} />
            {layer.sizeField ? `Círculos maiores indicam ${layer.unit} maior.` : 'Um ponto por registro.'}
          </p>
        )}
      </Section>
      {metric?.note && <Section title="Ressalva">{metric.note}</Section>}
      {provenance && (
        <Section title="Fonte">
          <a href={provenance.source_url} target="_blank" rel="noreferrer" className="cursor-pointer underline decoration-tinta-fraca underline-offset-2 hover:decoration-tinta">
            {provenance.source}
          </a>
          {provenance.year_note && <p className="mt-1 text-sm leading-snug text-tinta-fraca">{provenance.year_note}</p>}
        </Section>
      )}
    </article>
  )
}
