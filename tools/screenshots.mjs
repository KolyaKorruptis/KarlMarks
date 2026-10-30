// Screenshots: loads a copy of the extension into Chromium with sample links.
// `npm run screenshots` saves the README images screenshots/normal.png and screenshots/manage.png,
// `npm run screenshots -- --store` saves 1280x800 images (dark with groups, light, manage mode, settings) for the Chrome Web Store to .Google-Store-Images/ (not in git).
// The sample sites are visited first so the browser's favicon cache knows their icons, that needs network access.
// CHROMIUM_PATH=/path/to/chrome uses another Chromium build (branded Chrome ignores --load-extension).
import { chromium } from 'playwright-core'
import fs from 'fs'
import os from 'os'
import path from 'path'

const root = path.join(path.dirname(new URL(import.meta.url).pathname), '..')
const store = process.argv.includes('--store')
const out = path.join(root, store ? '.Google-Store-Images' : 'screenshots')
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'karlmarks-shots-'))
const ext = path.join(scratch, 'extension')
for (const f of ['manifest.json', 'index.html', 'css', 'js', 'icons']) fs.cpSync(path.join(root, f), path.join(ext, f), { recursive: true })

const ctx = await chromium.launchPersistentContext(path.join(scratch, 'profile'), {
  executablePath: process.env.CHROMIUM_PATH || undefined,
  headless: false,
  // the store wants exactly 1280x800, 1.25x keeps the desktop layout and makes the text a bit larger
  viewport: store ? { width: 1024, height: 640 } : { width: 1000, height: 1000 },
  deviceScaleFactor: store ? 1.25 : 2,
  colorScheme: 'dark',
  args: ['--headless=new', `--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
})

// sample links, stored bottom to top like the real data
const links = [
  { link: 'https://www.youtube.com/', title: 'YouTube' },
  { title: 'Reading', open: false, links: [{ link: 'https://news.ycombinator.com/', title: 'Hacker News' }, { link: 'https://www.theguardian.com/', title: 'The Guardian' }] },
  { title: 'Dev', open: true, links: [{ link: 'https://codeberg.org/', title: 'Codeberg' }, { link: 'https://stackoverflow.com/', title: 'Stack Overflow' }, { link: 'https://developer.mozilla.org/', title: 'MDN Web Docs' }] },
  { link: 'https://www.wikipedia.org/', title: 'Wikipedia' },
  { link: 'https://mastodon.social/', title: 'Mastodon' },
  { link: 'https://github.com/', title: 'GitHub' },
]

const visit = await ctx.newPage()
for (const { link } of links.flatMap((l) => l.links || [l])) {
  try {
    await visit.goto(link, { waitUntil: 'load', timeout: 20000 })
    await visit.waitForTimeout(1500)
  } catch (e) { console.log('could not load', link, '- its icon may be missing') }
}
await visit.close()

const page = await ctx.newPage()
await page.goto('chrome://newtab')
await page.waitForTimeout(500)
await page.goto(await page.evaluate(() => location.href))
await page.evaluate(async (links) => { await depot.set('sp-links', links); localStorage.removeItem('links') }, links)
await page.reload()
await page.waitForTimeout(1000)

// the box plus a margin of the dotted background, for the store the whole page
const shoot = async (name) => {
  await page.mouse.move(0, 0)
  await page.waitForTimeout(300)
  if (store) {
    await page.screenshot({ path: path.join(out, name) })
    console.log('saved', path.join(path.basename(out), name))
    return
  }
  const box = await page.$eval('main', (m) => { const r = m.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height } })
  const margin = 48
  await page.screenshot({ path: path.join(out, name), clip: { x: box.x - margin, y: box.y - margin, width: box.width + 2 * margin, height: box.height + 2 * margin } })
  console.log('saved', path.join('screenshots', name))
}
fs.mkdirSync(out, { recursive: true })
if (store) {
  await shoot('store-1-groups-dark.png')
  await page.emulateMedia({ colorScheme: 'light' })
  await shoot('store-2-light.png')
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.click('#manageToggle__label')
  await shoot('store-3-manage.png')
  await page.click('#settingsButton')
  await shoot('store-4-settings.png')
} else {
  await shoot('normal.png')
  await page.click('#manageToggle__label')
  await page.waitForTimeout(500)
  await shoot('manage.png')
}

await ctx.close()
fs.rmSync(scratch, { recursive: true, force: true })
