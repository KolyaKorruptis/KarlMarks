// Browser test for the extension: loads it unpacked into Chromium and clicks through everything.
// Run with `npm test`, once before that `npx playwright-core install chromium`.
// CHROMIUM_PATH=/path/to/chrome uses another Chromium build (branded Chrome ignores --load-extension).
import { chromium } from 'playwright-core'
import fs from 'fs'
import os from 'os'
import path from 'path'

// load a copy with only the extension's files, node_modules and the tests don't belong in it
const root = path.join(path.dirname(new URL(import.meta.url).pathname), '..')
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'karlmarks-test-'))
const ext = path.join(scratch, 'extension')
for (const f of ['manifest.json', 'index.html', 'css', 'js', 'icons']) fs.cpSync(path.join(root, f), path.join(ext, f), { recursive: true })
const userDir = path.join(scratch, 'profile')
const ctx = await chromium.launchPersistentContext(userDir, {
  executablePath: process.env.CHROMIUM_PATH || undefined,
  headless: false,
  args: ['--headless=new', `--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
})
// count storage writes made by the page
await ctx.addInitScript(() => {
  if (!globalThis.chrome?.storage) return
  window.__writes = []
  for (const area of ['sync', 'local']) {
    const s = chrome.storage[area], orig = s.set.bind(s)
    s.set = (obj) => { window.__writes.push(area + ':' + Object.keys(obj).join(',')); return orig(obj) }
  }
})

const errors = []
let ok = 0, fail = 0
const check = (name, cond, extra = '') => { cond ? ok++ : fail++; console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')) }

let page = await ctx.newPage()
page.on('pageerror', e => errors.push(e.message))
page.on('console', m => m.type() == 'error' && errors.push(m.text()))
await page.goto('chrome://newtab')
await page.waitForTimeout(500)
const url = page.url().startsWith('chrome-extension') ? page.url() : await page.evaluate(() => location.href)
const base = url.replace(/[#?].*$/, '').replace(/index\.html$/, '') + 'index.html'
console.log('page:', base)
await page.goto(base)
await page.waitForTimeout(500)

const titles = () => page.$$eval('.linklist__itemTitle', els => els.map(e => e.textContent))
const syncData = () => page.evaluate(() => chrome.storage.sync.get(null))
const stored = () => page.evaluate(() => depot.get('sp-links'))
const writes = () => page.evaluate(() => window.__writes)

// first run
check('defaults rendered', JSON.stringify(await titles()) == JSON.stringify(['Google', 'Bing Images', 'Karl Marks on Github']), JSON.stringify(await titles()))
check('no writes on first load', (await writes()).length == 0, JSON.stringify(await writes()))
check('sync storage empty on first load', Object.keys(await syncData()).length == 0)
check('theme defaults to system', await page.evaluate(() => document.documentElement.dataset.theme) == 'system')

// add without scheme, via Enter, after toggling manage a few times
for (let i = 0; i < 3; i++) { await page.click('#manageToggle__label'); await page.waitForTimeout(250) }
check('manage open', await page.isChecked('#manageToggle'))
await page.fill('#newLink__url', 'example.com')
await page.press('#newLink__url', 'Enter')
await page.waitForTimeout(300)
let t = await titles()
check('added once via Enter, https:// prepended', t.filter(x => x == 'example.com').length == 1 && t.length == 4, JSON.stringify(t))
check('href is https://example.com/', await page.getAttribute('.linklist__itemLink', 'href') == 'https://example.com/')
check('manage closed after add', !(await page.isChecked('#manageToggle')))
check('saved to sync', (await stored())?.length == 4)

// invalid url
await page.click('#manageToggle__label')
await page.fill('#newLink__url', 'http://')
await page.press('#newLink__url', 'Enter')
await page.waitForTimeout(200)
check('invalid url rejected', (await titles()).length == 4 && await page.evaluate(() => newLink__url.validationMessage) != '')
check('no uncaught errors so far', errors.length == 0, JSON.stringify(errors))

// unicode + html in title
await page.fill('#newLink__url', 'https://unicode.test/päth')
await page.fill('#newLink__title', 'Ünïcødé € 日本 😀 <b>bold</b> & co')
await page.click('#newLink__save')
await page.waitForTimeout(400)
t = await titles()
check('unicode/html title shown as text', t[0] == 'Ünïcødé € 日本 😀 <b>bold</b> & co', t[0])
let s = await stored()
check('unicode title saved to sync', s?.length == 5 && s.at(-1).title.includes('日本 😀'), JSON.stringify(s?.at(-1)))
check('stored links have no icon key', s.every(l => !('icon' in l)))
check('no errors after unicode save', errors.length == 0, JSON.stringify(errors))

// edit via button, Enter must modify not duplicate
await page.click('#manageToggle__label')
await page.click('.linklist__item:nth-child(2) .linklist__itemEditButton')
check('edit fills form', await page.inputValue('#newLink__url') == 'https://example.com/' && await page.inputValue('#newLink__title') == 'example.com')
check('edit mode title', await page.textContent('#linkAdm__title') == 'Modify Link')
await page.fill('#newLink__title', 'Example edited')
await page.press('#newLink__title', 'Enter')
await page.waitForTimeout(300)
t = await titles()
check('edited in place, no duplicate', t.length == 5 && t[1] == 'Example edited', JSON.stringify(t))
check('form back in add mode', await page.textContent('#linkAdm__title') == 'Add New Link')

// edit and keep the unicode title unchanged -> still the same text
await page.click('#manageToggle__label')
await page.click('.linklist__item:nth-child(1) .linklist__itemEditButton')
await page.press('#newLink__url', 'Enter')
await page.waitForTimeout(300)
t = await titles()
check('round trip keeps title', t[0] == 'Ünïcødé € 日本 😀 <b>bold</b> & co' && t.length == 5, t[0])

// favicon cache icons
const src = await page.getAttribute('.linklist__item:nth-child(2) .linklist__itemIcon', 'src')
check('icon uses /_favicon/', src.startsWith('/_favicon/?pageUrl='), src)
const fav = await page.evaluate(async (src) => (await fetch(src)).status, src)
check('/_favicon/ responds 200', fav == 200, String(fav))
s = await stored()
check('no google favicon urls rendered', !(await page.content()).includes('google.com/s2/favicons'))

// delete
await page.click('#manageToggle__label')
await page.click('.linklist__item:nth-child(1) .linklist__itemDeleteButton')
await page.waitForTimeout(300)
check('deleted on page, not yet stored', (await titles()).length == 4 && (await stored()).length == 5)
await page.click('#newLink__save'); await page.waitForTimeout(300)
check('Save with empty form stores and closes manage', (await stored()).length == 4 && !(await page.isChecked('#manageToggle')))

// Cancel goes back to the state before managing
{
  const before = await titles(), storedBefore = JSON.stringify(await stored()), writesBefore = (await writes()).length
  await page.click('#manageToggle__label'); await page.waitForTimeout(300)
  await page.click('.linklist__item:nth-child(2) .linklist__itemDeleteButton'); await page.waitForTimeout(200)
  await page.dragAndDrop('.linklist__item:nth-child(3) .linklist__itemMoveHandle', '.linklist__item:nth-child(1)', { targetPosition: { x: 40, y: 2 } }); await page.waitForTimeout(300)
  await page.dragAndDrop('.linklist__item:nth-child(2) .linklist__itemTitle', '.linklist__item:nth-child(1)'); await page.waitForTimeout(300)
  check('changes visible while managing', JSON.stringify(await titles()) != JSON.stringify(before))
  check('no writes while managing', (await writes()).length == writesBefore, JSON.stringify((await writes()).slice(writesBefore)))
  await page.click('#manageToggle__label'); await page.waitForTimeout(300)
  check('Cancel restores order, deletes and groups', JSON.stringify(await titles()) == JSON.stringify(before) && !(await page.$('.linklist__group')), JSON.stringify(await titles()))
  check('Cancel leaves storage untouched', JSON.stringify(await stored()) == storedBefore && (await writes()).length == writesBefore)
  check('form reset after Cancel', await page.textContent('#linkAdm__title') == 'Add New Link')
}

// drag reorder
check('grab bar hidden in normal mode', !(await page.isVisible('.linklist__itemMoveHandle')))
let before = await titles()
await page.dragAndDrop('.linklist__item:nth-child(3) .linklist__itemLink', '.linklist__item:nth-child(1)')
await page.waitForTimeout(200)
check('no reorder in normal mode', JSON.stringify(await titles()) == JSON.stringify(before))
await page.click('#manageToggle__label'); await page.waitForTimeout(300)
check('grab bar visible in manage mode', await page.isVisible('.linklist__itemMoveHandle'))
const bar = await page.$eval('.linklist__item:nth-child(1)', li => { const r = s => li.querySelector(s).getBoundingClientRect(); return { title: r('.linklist__itemLink').right, barL: r('.linklist__itemMoveHandle').left, barR: r('.linklist__itemMoveHandle').right, del: r('.linklist__itemDeleteButton').left, edit: r('.linklist__itemEditButton').left, li: li.getBoundingClientRect() } })
check('layout: edit, title, bar, delete at the right end', bar.edit < bar.title && bar.title <= bar.barL && bar.barR <= bar.del && bar.li.right - bar.del < 30, JSON.stringify(bar))
await page.dragAndDrop('.linklist__item:nth-child(4) .linklist__itemMoveHandle', '.linklist__item:nth-child(1)', { targetPosition: { x: 40, y: 2 } })
await page.waitForTimeout(300)
let t2 = await titles()
check('drag by grab bar', t2[0] == before[3] && t2.length == 4, JSON.stringify(t2))
check('reorder not saved while managing', (await stored()).at(-1).title != before[3])
await page.dragAndDrop('.linklist__item:nth-child(3) .linklist__itemTitle', '.linklist__item:nth-child(2)', { targetPosition: { x: 40, y: 2 } })
await page.waitForTimeout(300)
t = await titles()
check('drag by title', t[1] == t2[2] && t[2] == t2[1], JSON.stringify(t))
check('no .over left', (await page.$$('.linklist__item.over')).length == 0)
check('manage still open after drag', await page.isChecked('#manageToggle'))
await page.click('#newLink__save'); await page.waitForTimeout(300)
check('reorder saved with Save', JSON.stringify((await stored()).map(l => l.title).reverse()) == JSON.stringify(t.map(x => x.replace('<b>bold</b> & co', '&lt;b&gt;bold&lt;/b&gt; &amp; co'))), JSON.stringify((await stored()).map(l => l.title)))

await page.click('#manageToggle__label')
await page.fill('#newLink__url', 'https://picked.test/')
await page.press('#newLink__url', 'Enter')
await page.waitForTimeout(300)
check('no icon inputs left', (await page.$$('#newLink__icon, #newLink__iconPick')).length == 0)


// ---------------- groups ----------------
{
  const top = (sel) => ({ targetPosition: { x: 60, y: 2 } })
  const bottom = async (sel) => ({ targetPosition: { x: 60, y: (await page.$eval(sel, el => el.getBoundingClientRect().height)) - 2 } })
  const structure = () => page.$$eval('#linklist > li', lis => lis.map(li => li.classList.contains('linklist__group')
    ? { group: li.querySelector('.linklist__itemTitle').textContent, open: li.classList.contains('open'), items: [...li.querySelector('.linklist__groupList').children].map(c => c.querySelector('.linklist__itemTitle').textContent) }
    : li.querySelector('.linklist__itemTitle').textContent))
  const S = async () => JSON.stringify(await structure())
  await page.evaluate(async () => { await depot.set('sp-links', [{ link: 'https://d.test/', title: 'D' }, { link: 'https://c.test/', title: 'C' }, { link: 'https://b.test/', title: 'B' }, { link: 'https://a.test/', title: 'A' }]); localStorage.removeItem('links') })
  await page.reload(); await page.waitForTimeout(500)
  check('group setup', await S() == '["A","B","C","D"]', await S())
  await page.click('#manageToggle__label'); await page.waitForTimeout(300)

  // drop B on the middle of A -> group, rename right away
  await page.dragAndDrop('#linklist > li:nth-child(2) .linklist__itemTitle', '#linklist > li:nth-child(1)')
  await page.waitForTimeout(300)
  check('middle drop creates group', await S() == '[{"group":"New Group","open":true,"items":["A","B"]},"C","D"]', await S())
  check('rename mode, url hidden', await page.textContent('#linkAdm__title') == 'Rename Group' && !(await page.isVisible('#newLink__url')) && await page.evaluate(() => document.activeElement.id) == 'newLink__title')
  await page.keyboard.type('Letters')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(300)
  check('group renamed', await S() == '[{"group":"Letters","open":true,"items":["A","B"]},"C","D"]', await S())
  check('url field back after rename', await page.textContent('#linkAdm__title') == 'Add New Link')
  let st = await stored()
  check('group stored', JSON.stringify(st) == '[{"link":"https://d.test/","title":"D"},{"link":"https://c.test/","title":"C"},{"title":"Letters","open":true,"links":[{"link":"https://b.test/","title":"B"},{"link":"https://a.test/","title":"A"}]}]', JSON.stringify(st))

  // collapse in normal mode, state saved and survives reload
  check('manage closed after rename', !(await page.isChecked('#manageToggle')))
  await page.click('.linklist__group > .linklist__itemLink')
  await page.waitForTimeout(300)
  check('collapsed', !(await page.isVisible('.linklist__groupList .linklist__item')) && (await stored()).at(-1).open === false)
  await page.reload()
  check('collapsed right after reload', await page.evaluate(() => !document.querySelector('.linklist__group').classList.contains('open')))
  await page.waitForTimeout(500)
  check('arrow instead of favicon', await page.$eval('.linklist__group > .linklist__itemLink', a => !a.querySelector('img') && getComputedStyle(a.querySelector('.linklist__groupArrow'), '::before').transform == 'none'))

  // drop C on the middle of the collapsed group header -> appended, stays collapsed
  await page.click('#manageToggle__label'); await page.waitForTimeout(300)
  await page.dragAndDrop('#linklist > li:nth-child(2) .linklist__itemTitle', '.linklist__group > .linklist__itemLink')
  await page.waitForTimeout(300)
  check('drop into collapsed group', await S() == '[{"group":"Letters","open":false,"items":["A","B","C"]},"D"]', await S())

  // expand in manage mode, drop D after the open header -> first entry of the group
  await page.click('.linklist__group > .linklist__itemLink'); await page.waitForTimeout(200)
  await page.dragAndDrop('#linklist > li:nth-child(2) .linklist__itemTitle', '.linklist__group > .linklist__itemLink', await bottom('.linklist__group > .linklist__itemLink'))
  await page.waitForTimeout(300)
  check('drop after open header = first entry', await S() == '[{"group":"Letters","open":true,"items":["D","A","B","C"]}]', await S())

  // drag entries out above the group
  await page.dragAndDrop('.linklist__groupList > li:nth-child(1) .linklist__itemTitle', '.linklist__group > .linklist__itemLink', top())
  await page.waitForTimeout(300)
  check('drag out of group', await S() == '["D",{"group":"Letters","open":true,"items":["A","B","C"]}]', await S())
  // reorder inside the group: C before A
  await page.dragAndDrop('.linklist__groupList > li:nth-child(3) .linklist__itemMoveHandle', '.linklist__groupList > li:nth-child(1)', top())
  await page.waitForTimeout(300)
  check('reorder inside group', await S() == '["D",{"group":"Letters","open":true,"items":["C","A","B"]}]', await S())
  // middle drop on an entry inside a group doesn't nest
  await page.dragAndDrop('#linklist > li:nth-child(1) .linklist__itemTitle', '.linklist__groupList > li:nth-child(2)')
  await page.waitForTimeout(300)
  check('no nesting inside group', !(await page.$('.linklist__groupList .linklist__group')) && (await S()).includes('"D"'), await S())
  check('no drop marks left', (await page.$$('[class*="over-"]')).length == 0)
  check('no dimmed rows left', (await page.$$('.linklist__item.dragging')).length == 0)

  // reset to D, group(C,A,B) for the next steps
  await page.evaluate(async () => { await depot.set('sp-links', [{ title: 'Letters', open: true, links: [{ link: 'https://b.test/', title: 'B' }, { link: 'https://a.test/', title: 'A' }, { link: 'https://c.test/', title: 'C' }] }, { link: 'https://d.test/', title: 'D' }]); localStorage.removeItem('links') })
  await page.reload(); await page.waitForTimeout(500)
  await page.click('#manageToggle__label'); await page.waitForTimeout(300)
  check('reset groups', await S() == '["D",{"group":"Letters","open":true,"items":["C","A","B"]}]', await S())

  // dragging a group onto the middle of a link only reorders
  await page.dragAndDrop('.linklist__group > .linklist__itemMoveHandle', '#linklist > li:nth-child(1)', top())
  await page.waitForTimeout(300)
  check('group reorders as a whole', await S() == '[{"group":"Letters","open":true,"items":["C","A","B"]},"D"]', await S())
  await page.dragAndDrop('.linklist__group > .linklist__itemLink', '#linklist > li:nth-child(2)')
  await page.waitForTimeout(300)
  check('group dropped on middle of link does not nest', (await S()).startsWith('[') && !(await page.$('.linklist__groupList .linklist__group')) && (await page.$$('#linklist > li')).length == 2, await S())

  // dissolve at one link: delete two entries
  await page.click('.linklist__groupList > li:nth-child(1) .linklist__itemDeleteButton'); await page.waitForTimeout(200)
  check('two left, still a group', (await page.$$('.linklist__group')).length == 1)
  await page.click('.linklist__groupList > li:nth-child(1) .linklist__itemDeleteButton'); await page.waitForTimeout(300)
  check('one left -> dissolved', (await page.$$('.linklist__group')).length == 0 && (await titles()).length == 2, JSON.stringify(await titles()))
  await page.click('#newLink__save'); await page.waitForTimeout(300)
  check('dissolved in storage', (await stored()).every(l => !l.links))
  await page.click('#manageToggle__label'); await page.waitForTimeout(300)

  // ungroup with x keeps the links in place
  await page.dragAndDrop('#linklist > li:nth-child(2) .linklist__itemTitle', '#linklist > li:nth-child(1)')
  await page.waitForTimeout(300)
  await page.fill('#newLink__title', '')
  await page.press('#newLink__title', 'Enter'); await page.waitForTimeout(300)
  const beforeUngroup = await titles()
  await page.click('#manageToggle__label'); await page.waitForTimeout(300)
  await page.click('.linklist__group > .linklist__itemDeleteButton'); await page.waitForTimeout(300)
  check('ungroup keeps links in order', (await page.$$('.linklist__group')).length == 0 && JSON.stringify(await titles()) == JSON.stringify(beforeUngroup.filter(t => t != 'Group')), JSON.stringify(await titles()))
  check('empty rename falls back to "Group"', beforeUngroup.includes('Group'), JSON.stringify(beforeUngroup))
  await page.click('#newLink__save'); await page.waitForTimeout(300)

  // groups in backups
  const gb = path.join(scratch, 'groups.json')
  fs.writeFileSync(gb, JSON.stringify({ links: [{ link: 'https://z.test/', title: 'Z', icon: 'https://x/i.png' }, { title: 'G', open: false, links: [{ link: 'https://y.test/', title: 'Y' }, { link: 'https://x.test/', title: 'X', icon: 'data:,' }] }], settings: {} }))
  await page.click('#manageToggle__label'); await page.waitForTimeout(300); await page.click('#settingsButton')
  await page.setInputFiles('#import', gb); await page.waitForTimeout(600)
  check('import with group', await S() == '[{"group":"G","open":false,"items":["X","Y"]},"Z"]', await S())
  const [gdl] = await Promise.all([page.waitForEvent('download'), page.click('#backupButton')])
  const gj = JSON.parse(fs.readFileSync(await gdl.path(), 'utf8'))
  await page.click('#closeSettings'); await page.click('#manageToggle__label'); await page.waitForTimeout(300)
  check('Cancel after import keeps the import', await S() == '[{"group":"G","open":false,"items":["X","Y"]},"Z"]', await S())
  await page.click('#manageToggle__label'); await page.waitForTimeout(300); await page.click('#settingsButton')
  check('backup keeps groups, no icons', JSON.stringify(gj.links) == '[{"link":"https://z.test/","title":"Z"},{"title":"G","open":false,"links":[{"link":"https://y.test/","title":"Y"},{"link":"https://x.test/","title":"X"}]}]', JSON.stringify(gj.links))
  await page.click('#closeSettings'); await page.click('#manageToggle__label'); await page.waitForTimeout(300)
}

// reload: mirror paints instantly, no writes
const orderBefore = await titles()
await page.reload()
const immediate = await page.evaluate(() => [...document.querySelectorAll('.linklist__itemTitle')].map(e => e.textContent))
check('links present right after load', JSON.stringify(immediate) == JSON.stringify(orderBefore), JSON.stringify(immediate))
await page.waitForTimeout(600)
check('no writes on reload', (await writes()).length == 0, JSON.stringify(await writes()))
check('order kept after reload', JSON.stringify(await titles()) == JSON.stringify(orderBefore))

// theme
await page.click('#manageToggle__label'); await page.waitForTimeout(300); await page.click('#settingsButton')
await page.click('#light')
await page.waitForTimeout(300)
const bg = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg').trim())
check('light theme applied', await bg() == '#c4c1bc' && await page.evaluate(() => localStorage.colorMode) == 'light')
await page.reload()
check('light theme before scripts finish', await page.evaluate(() => document.documentElement.dataset.theme) == 'light')
await page.waitForTimeout(400)
check('light radio checked after reload', await page.isChecked('#light'))
check('colorMode stored in sync settings', (await page.evaluate(() => depot.get('sp-settings'))).colorMode == 'light')
await page.emulateMedia({ colorScheme: 'light' })
await page.click('#manageToggle__label'); await page.waitForTimeout(300); await page.click('#settingsButton'); await page.click('#dark'); await page.waitForTimeout(200)
check('dark overrides system light', await bg() == '#262626')
await page.click('#system'); await page.waitForTimeout(200)
check('system + light OS = light', await bg() == '#c4c1bc')
await page.emulateMedia({ colorScheme: 'dark' })
check('system + dark OS = dark', await bg() == '#262626')
await page.click('#closeSettings'); await page.click('#manageToggle__label')

// stale chunks: grow then shrink
await page.evaluate(async () => {
  const big = Array.from({ length: 60 }, (_, i) => ({ link: 'https://x' + i + '.test/', title: 'x'.repeat(300), icon: '' }))
  await depot.set('sp-links', big)
})
const bigNum = (await syncData())['sp-links#']
await page.evaluate(async () => depot.set('sp-links', [{ link: 'https://a.test/', title: 'a', icon: '' }]))
const sd = await syncData()
const chunkKeys = Object.keys(sd).filter(k => /^sp-links\d+$/.test(k))
check('stale chunks removed', bigNum > 1 && sd['sp-links#'] == 1 && chunkKeys.length == 1, `big=${bigNum} keys=${chunkKeys}`)

// old format compat: data written by the old btoa(JSON) code still reads
await page.evaluate(async () => {
  const str = btoa(JSON.stringify([{ link: 'https://old.test/', title: 'Old &amp; Gold', icon: 'https://www.google.com/s2/favicons?sz=32&domain_url=old.test' }]))
  await chrome.storage.sync.set({ 'sp-links#': 1, 'sp-links0': str })
})
await page.reload(); await page.waitForTimeout(500)
t = await titles()
check('old sync data loads', t.length == 1 && t[0] == 'Old & Gold', JSON.stringify(t))
check('old icon ignored, /_favicon/ used', (await page.getAttribute('.linklist__itemIcon', 'src')).startsWith('/_favicon/'))

// import / backup
const backup = path.join(scratch, 'KarlMarks.json')
fs.writeFileSync(backup, JSON.stringify({ links: [{ link: 'https://b.test/', title: 'B', icon: '' }, { link: 'https://a.test/', title: 'A', icon: '' }], settings: { colorMode: 'dark' } }))
await page.setInputFiles('#import', backup)
await page.waitForTimeout(600)
check('import renders', JSON.stringify(await titles()) == '["A","B"]', JSON.stringify(await titles()))
check('import saved', (await stored()).length == 2 && (await page.evaluate(() => depot.get('sp-settings'))).colorMode == 'dark')
check('import applied theme', await page.evaluate(() => document.documentElement.dataset.theme) == 'dark')
// backup exactly as the previous version wrote it (getBackup of the last release)
const prevBackup = path.join(scratch, 'prev.json')
fs.writeFileSync(prevBackup, '{"links":[{"link":"https://www.google.com/","title":"Tom &amp; Jerry","icon":"https://www.google.com/s2/favicons?sz=32&domain_url=www.google.com"},{"link":"https://unicode.test/","title":"Ünï 日本","icon":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="}],"settings":{"colorMode":"light"}}')
await page.setInputFiles('#import', prevBackup)
await page.waitForTimeout(600)
check('previous-version backup imports', JSON.stringify(await titles()) == '["Ünï 日本","Tom & Jerry"]', JSON.stringify(await titles()))
check('previous-version icons ignored', (await page.$$eval('.linklist__itemIcon', els => els.every(e => e.getAttribute('src').startsWith('/_favicon/')))))
check('previous-version icons dropped from storage', (await stored()).every(l => !('icon' in l)), JSON.stringify(await stored()))
check('previous-version settings applied', await page.evaluate(() => document.documentElement.dataset.theme) == 'light')
await page.evaluate(() => chrome.storage.sync.set({ 'sp-links#': 1, 'sp-links0': btoa(JSON.stringify([{ link: 'https://b.test/', title: 'B', icon: 'data:image/png;base64,AAAA' }, { link: 'https://a.test/', title: 'A', icon: 'https://x.test/i.png' }])) }))
await page.click('#manageToggle__label'); await page.waitForTimeout(300); await page.click('#settingsButton')
const [download] = await Promise.all([page.waitForEvent('download'), page.click('#backupButton')])
const dl = JSON.parse(fs.readFileSync(await download.path(), 'utf8'))
check('backup contains links + settings', dl.links.length == 2 && dl.settings.colorMode == 'light', JSON.stringify(dl))
check('backup has no icons even if storage still has them', dl.links.every(l => !('icon' in l)))

// local data store (settings still open)
await page.click('#syncToggle')
await page.waitForTimeout(1200)
check('switched to local, defaults shown', JSON.stringify(await titles()) == JSON.stringify(['Google', 'Bing Images', 'Karl Marks on Github']), JSON.stringify(await titles()))
check('toggle shows local', !(await page.isChecked('#syncToggle')))
await page.click('#manageToggle__label')
await page.fill('#newLink__url', 'https://local.test/')
await page.press('#newLink__url', 'Enter')
await page.waitForTimeout(300)
check('local save', (await page.evaluate(() => chrome.storage.local.get('sp-links')))['sp-links']?.length == 4)
check('sync untouched', (await page.evaluate(() => depot.get('sp-links', 'sync'))).length == 2)

// popup mode
const popup = await ctx.newPage()
popup.on('pageerror', e => errors.push(e.message))
await popup.goto(base + '#popup')
await popup.waitForTimeout(400)
check('popup base target', await popup.evaluate(() => document.querySelector('base')?.target) == '_blank')
await popup.close()

check('no page errors overall', errors.length == 0, JSON.stringify(errors))
console.log(`\n${ok} passed, ${fail} failed`)
await ctx.close()
fs.rmSync(scratch, { recursive: true, force: true })
process.exit(fail ? 1 : 0)
