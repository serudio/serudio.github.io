// One-off/maintenance utility: rasterizes public/logo.svg onto a
// 1200x630 canvas (the standard Open Graph/Twitter card image size) with
// the brand's obsidian background, and writes public/og-image.png.
//
// Re-run this (`npm run generate:og-image`) whenever the logo or brand
// background color changes. Not part of the build — the image is a
// committed static asset like the logo itself.
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const logoPng = await sharp(readFileSync(path.join(root, 'public/logo.svg')))
  .resize(360, 360)
  .png()
  .toBuffer()

await sharp({
  create: { width: 1200, height: 630, channels: 4, background: '#05070b' },
})
  .composite([{ input: logoPng, gravity: 'center' }])
  .png()
  .toFile(path.join(root, 'public/og-image.png'))

console.log('Generated public/og-image.png (1200x630) from public/logo.svg')
