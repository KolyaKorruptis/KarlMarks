// `npm run build` packs the extension into dist/ and updates updates.xml:
//   dist/KarlMarks-x.y.z.zip  for the Chrome Web Store, without update_url (the store updates it)
//   dist/KarlMarks.crx        signed GitHub build, updates itself through updates.xml on master
// The signing key stays outside the repo and fixes the GitHub build's extension ID, losing it means
// GitHub installs get no more updates. KARLMARKS_KEY=/path/key.pem overrides the default location,
// CHROMIUM_PATH=/path/to/chrome another Chromium for packing.
import { chromium } from 'playwright-core'
import { execFileSync } from 'child_process'
import crypto from 'crypto'
import fs from 'fs'
import os from 'os'
import path from 'path'

const repo = 'KolyaKorruptis/KarlMarks'
const root = path.join(path.dirname(new URL(import.meta.url).pathname), '..')
const files = ['manifest.json', 'index.html', 'css', 'js', 'icons']
const key = process.env.KARLMARKS_KEY || path.join(os.homedir(), '.config/karlmarks/karlmarks.pem')
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json')))
const version = manifest.version
if (manifest.update_url) throw new Error('manifest.json must not have an update_url, the store package is built from it')

const dist = path.join(root, 'dist')
fs.rmSync(dist, { recursive: true, force: true })
fs.mkdirSync(dist)
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'karlmarks-build-'))
process.on('exit', () => fs.rmSync(scratch, { recursive: true, force: true }))
const stage = (manifest) => {
  const dir = path.join(scratch, 'KarlMarks')
  fs.rmSync(dir, { recursive: true, force: true })
  for (const f of files) fs.cpSync(path.join(root, f), path.join(dir, f), { recursive: true })
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, '\t'))
  return dir
}

// store zip, files at the top level
const zip = path.join(dist, `KarlMarks-${version}.zip`)
execFileSync('zip', ['-qrX', zip, ...files], { cwd: stage(manifest) })
console.log('saved', path.relative(root, zip))

if (!fs.existsSync(key)) {
  console.log(`no signing key at ${key}, skipped KarlMarks.crx and updates.xml`)
  process.exit()
}

// the extension ID is the start of the public key's sha256, written with the letters a-p
const der = crypto.createPublicKey(fs.readFileSync(key)).export({ type: 'spki', format: 'der' })
const id = crypto.createHash('sha256').update(der).digest('hex').slice(0, 32).replace(/./g, (c) => 'abcdefghijklmnop'[parseInt(c, 16)])

// GitHub crx, Chromium packs and signs it next to the staged folder
const dir = stage({ ...manifest, update_url: `https://raw.githubusercontent.com/${repo}/master/updates.xml` })
execFileSync(process.env.CHROMIUM_PATH || chromium.executablePath(), [`--pack-extension=${dir}`, `--pack-extension-key=${key}`], { stdio: 'ignore' })
if (fs.readFileSync(dir + '.crx').subarray(0, 4).toString() != 'Cr24') throw new Error('Chromium did not write a crx')
fs.renameSync(dir + '.crx', path.join(dist, 'KarlMarks.crx'))
console.log('saved dist/KarlMarks.crx, extension ID', id)

// the codebase points at this version's release, so an early push of updates.xml can't serve an older crx
fs.writeFileSync(path.join(root, 'updates.xml'), `<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='${id}'>
    <updatecheck codebase='https://github.com/${repo}/releases/download/v${version}/KarlMarks.crx' version='${version}' />
  </app>
</gupdate>
`)
console.log('saved updates.xml for', version)
