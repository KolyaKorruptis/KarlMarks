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

When packaging for the Chrome Web Store, zip only `manifest.json`, `index.html`, `css/`, `js/` and `icons/`.
