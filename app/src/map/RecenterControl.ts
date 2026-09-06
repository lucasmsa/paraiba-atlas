import type { IControl, Map as MapLibreMap } from 'maplibre-gl'
import { JOAO_PESSOA, PARAIBA_BOUNDS } from './constants'

function fitPadding(width: number) {
  if (width < 768) return { top: 62, bottom: 24, left: 8, right: 8 }
  return { top: 40, bottom: 40, left: 40, right: 400 }
}

/** Two ways back: the whole state, or João Pessoa, which is how people orient here. */
export class RecenterControl implements IControl {
  private container!: HTMLDivElement

  onAdd(map: MapLibreMap): HTMLElement {
    this.container = document.createElement('div')
    this.container.className = 'maplibregl-ctrl maplibregl-ctrl-group'

    this.container.append(
      this.button('Ver o estado inteiro', '◲', () => {
        map.fitBounds(PARAIBA_BOUNDS, { padding: fitPadding(window.innerWidth), duration: 600 })
      }),
      this.button('Ir para João Pessoa', '⌖', () => {
        map.easeTo({ center: JOAO_PESSOA, zoom: 10.5, duration: 700 })
      }),
    )
    return this.container
  }

  onRemove(): void {
    this.container.remove()
  }

  private button(label: string, glyph: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button')
    button.type = 'button'
    button.title = label
    button.setAttribute('aria-label', label)
    button.style.cursor = 'pointer'
    button.style.font = '15px/1 system-ui, sans-serif'
    button.textContent = glyph
    button.addEventListener('click', onClick)
    return button
  }
}
