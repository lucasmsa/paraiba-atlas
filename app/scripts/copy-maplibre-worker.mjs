/**
 * MapLibre's worker imports `./maplibre-gl-shared.mjs` as a sibling. Vite's `?url`
 * import emits the worker alone, so the sibling 404s and the worker dies silently,
 * leaving a blank map in any production build. Copying both preserves the relative
 * import, and copying from node_modules keeps them in step with the installed version.
 */
import { copyFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const from = join(here, '..', 'node_modules', 'maplibre-gl', 'dist')
const to = join(here, '..', 'public', 'maplibre')

await mkdir(to, { recursive: true })
for (const file of ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']) {
  await copyFile(join(from, file), join(to, file))
}
console.log('copied maplibre worker + shared chunk to public/maplibre/')
