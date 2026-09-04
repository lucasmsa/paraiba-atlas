interface Props {
  containerRef: React.RefObject<HTMLDivElement | null>
}

export function MapCanvas({ containerRef }: Props) {
  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  )
}
