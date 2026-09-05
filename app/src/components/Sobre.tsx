import { PILLARS } from '../config/pillars'
import { useSourceRows } from '../hooks/useManifestList'

interface Props {
  onClose: () => void
}

const GAPS = [
  'A AESA não publica o volume dos açudes sem autenticação, então os volumes vêm da ANA. As leituras dos pluviômetros continuam fechadas, e por isso a camada de postos mostra onde se mede, não quanto choveu.',
  'O Censo de 2022 não publicou valor de aluguel. Nenhuma das 1.388 tabelas do Censo traz o dado, então moradia aparece por condição do domicílio, não por preço.',
  'O Censo Escolar não publica coordenada de escola nenhuma. Os pontos de escola vêm do OpenStreetMap, que é colaborativo: 71 municípios não têm um único ponto.',
  'As ocorrências policiais do SINESP estão fora do ar. A violência aparece pelo registro de óbitos, que no nível municipal é mais confiável, porque uma morte sempre gera registro.',
  'O mapa de solos é de 1972 e usa a nomenclatura anterior ao sistema atual. Cada classe traz o nome moderno ao lado do original, e duas das 22 não puderam ser correlacionadas.',
]

export function Sobre({ onClose }: Props) {
  const rows = useSourceRows()

  return (
    <div className="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto bg-tinta/60 p-3 md:p-6" onClick={onClose}>
      <article
        className="cordel-papel cordel-bloco cordel-sombra my-3 flex w-full max-w-3xl flex-col gap-5 p-4 md:my-6 md:gap-6 md:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 className="cordel-titulo text-[22px] text-tinta md:text-[30px]">Sobre o atlas</h2>
            <p className="mt-1 text-base text-tinta-fraca">O que é, de onde vêm os dados e o que falta.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="cursor-pointer px-2 text-2xl leading-none text-tinta-fraca hover:text-tinta">
            ×
          </button>
        </header>

        <section className="flex flex-col gap-2">
          <p className="text-base leading-relaxed text-tinta">
            Um retrato dos 223 municípios da Paraíba em três pilares. <strong>Terra</strong> é a rocha, o solo, o relevo e o que se
            construiu sobre eles. <strong>Água</strong> é chuva, açude e saneamento. <strong>Gente</strong> é quem mora aqui, como
            vive e o que a escola, a saúde e a economia mostram.
          </p>
          <p className="text-base leading-relaxed text-tinta">
            Todo número vem de fonte pública e cada camada diz qual é a sua e de que ano. Nada é estimado para preencher buraco:
            onde não há dado, o mapa fica hachurado e diz "sem dados".
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="font-display text-[14px] uppercase leading-none text-tinta">O que falta, e por quê</h3>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-base leading-snug text-tinta">
            {GAPS.map((gap) => (
              <li key={gap.slice(0, 24)}>{gap}</li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="font-display text-[14px] uppercase leading-none text-tinta">Fontes por camada</h3>
          {!rows && <p className="text-base text-tinta-fraca">Carregando…</p>}
          {rows && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-base">
                <tbody>
                  {PILLARS.map((pillar) => {
                    const pillarRows = rows.filter((row) => row.pillar === pillar.id)
                    if (pillarRows.length === 0) return null
                    return (
                      <tr key={pillar.id} className="align-top">
                        <th scope="row" className="border-t-2 border-tinta/25 py-2 pr-4 text-left font-display text-[13px] uppercase leading-none" style={{ color: pillar.accent }}>
                          {pillar.label}
                        </th>
                        <td className="border-t-2 border-tinta/25 py-2">
                          <ul className="flex flex-col gap-1.5">
                            {pillarRows.map((row) => (
                              <li key={row.label} className="leading-snug">
                                <span className="font-semibold">{row.label}</span>
                                <span className="text-tinta-fraca">
                                  {' · '}
                                  <a href={row.entry.source_url} target="_blank" rel="noreferrer" className="cursor-pointer underline decoration-tinta-fraca underline-offset-2 hover:decoration-tinta">
                                    {row.entry.source}
                                  </a>
                                  {' · '}
                                  {row.entry.year}
                                  {row.entry.editorial ? ' · editorial' : ''}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="border-t-2 border-tinta/25 pt-3 text-sm leading-snug text-tinta-fraca">
          Para fins informativos. Os dados podem estar incompletos ou desatualizados, e cada camada diz de quando é a sua.
        </footer>
      </article>
    </div>
  )
}
