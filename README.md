![Karl Marks logo](icons/128.png)

Karl Marks is a Chrome browser extension that provides a custom new-tab-page for your most common bookmarks.

It loads extremely fast, you can drag & drop bookmarks in groups or the list. You can sync your bookmarks and settings or keep things local. Karl Marks is open source and respects your privacy.
 ## Features
  - Themes: bright / dark / match system
  - 2 separate data stores: local / synced
  - no dependencies, no frameworks, loads instantly
  - create, edit, sort and delete your bookmarks
  - collapsible, nameable groups: drop one bookmark onto another
  - favicons from browser cache
  - backup & import in JSON format

## [Install from Chrome Webstore](https://chromewebstore.google.com/detail/karl-marks/odkohchphnbfhpnpidbfgcmfmomeaaeo)

## Install from GitHub
For Chromium builds without the Chrome Web Store, e.g. ungoogled-chromium:
1. Set `chrome://flags/#extension-mime-request-handling` to **Always prompt for install**.
2. Open [KarlMarks.crx](https://github.com/KolyaKorruptis/KarlMarks/releases/latest/download/KarlMarks.crx) from the latest release and confirm the install.
3. For updates, use [chromium-web-store](https://github.com/NeverDecaf/chromium-web-store), it also checks extensions installed from outside the store.

The GitHub version is a separate extension from the store version, with its own bookmarks and settings. To move over, use Backup in one and Import in the other.

## Screenshots
<img src="screenshots/normal.png" alt="Karl Marks in dark mode with bookmarks and an expanded group" width="400"> <img src="screenshots/manage.png" alt="Manage mode with edit, reorder and delete controls" width="400">

## Development
The extension itself has no dependencies. The browser test uses `playwright-core`:

```
npm install
npx playwright-core install chromium   # once
npm test
npm run screenshots   # regenerates screenshots/, needs network access for the favicons
npm run screenshots -- --store   # 1280x800 images for the Chrome Web Store, saved to .Google-Store-Images/
```

### Releasing
1. Bump `version` in `manifest.json`.
2. `npm run build` saves `dist/KarlMarks-x.y.z.zip` for the Chrome Web Store and `dist/KarlMarks.crx` for GitHub installs, and writes `updates.xml`.
3. Commit `manifest.json` and `updates.xml`, push, and create the release `vx.y.z` with `dist/KarlMarks.crx` as its only asset.
4. Upload `dist/KarlMarks-x.y.z.zip` to the Chrome Web Store, it doesn't go into the release.

The crx is signed with `~/.config/karlmarks/karlmarks.pem` (`KARLMARKS_KEY=/path/key.pem` to use another). The key fixes the GitHub version's extension ID: keep a backup, without it GitHub installs get no more updates. Without the key, `npm run build` only makes the store zip.
