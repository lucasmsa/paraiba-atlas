interface Props {
  title: string
  subtitle?: string | null
  onClose: () => void
  closeLabel?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}

/**
 * Every floating panel shares this shell so the close control is always the same
 * size, in the same place, and stays put while the body scrolls.
 */
export function Panel({ title, subtitle, onClose, closeLabel = 'Fechar', actions, children, className = '' }: Props) {
  return (
    <section className={`cordel-bloco cordel-sombra flex min-h-0 flex-col ${className}`}>
      <header className="flex shrink-0 items-start justify-between gap-3 border-b-[3px] border-tinta bg-papel px-4 py-3">
        <div className="min-w-0">
          <h2 className="cordel-titulo text-[20px] text-tinta">{title}</h2>
          {subtitle && <p className="mt-0.5 truncate text-sm text-tinta-fraca">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center border-2 border-tinta bg-papel text-lg leading-none text-tinta transition-shadow hover:cordel-sombra-leve"
        >
          ×
        </button>
      </header>
      {actions && <div className="shrink-0 border-b-2 border-tinta/25 px-4 py-3">{actions}</div>}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">{children}</div>
    </section>
  )
}
