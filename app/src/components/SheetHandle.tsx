interface Props {
  open: boolean
  summary: string
  onToggle: () => void
}

export function SheetHandle({ open, summary, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="flex w-full shrink-0 cursor-pointer items-center justify-between gap-3 border-b-[3px] border-tinta px-4 py-3 text-left"
    >
      <span className="flex min-w-0 flex-col">
        <span className="cordel-titulo text-[17px] leading-none text-tinta">Atlas da Paraíba</span>
        <span className="mt-1 truncate text-sm text-tinta-fraca">{summary}</span>
      </span>
      <span aria-hidden className="shrink-0 text-lg leading-none text-tinta">
        {open ? '▾' : '▴'}
      </span>
    </button>
  )
}
