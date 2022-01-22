A custom browser startpage with a simple bookmark system. It is intended to be used as a replacement for the new-tab-page provided by the browser.

 ## Features
  - bright and dark mode based on system setting
  - bookmarks are stored in localstorage
  - bookmarks can be downloaded and uploaded for sharing between browsers, systems and users
  - icons are automatically retrieved from google
  - or choose an icon URL or a local image file
  - mobile and desktop supported
  - single file for optimized caching
  - no dependencies
  - runs from the local file system
## Live URL
https://kolya.schwarzsilber.de/startpage

## Usage
If you use the live url you will get automatic updates as development continues.
Or you can download the file index.html and place it anywhere (including your local system). You can still update it manually by replacing the file.

You may want to use a browser extension to set this file as your new-tab-page:

  - Firefox: [New Tab Override](https://addons.mozilla.org/en-US/firefox/addon/new-tab-override/)
  - Chrome: [blank](https://chrome.google.com/webstore/detail/blank/blomfhkjjolopkkglifoclbjmbbambpg)
  - Edge: [blank](https://microsoftedge.microsoft.com/addons/detail/blank/edoamabjjoiebpcmbkenbglenadopben)

## Notes
This is a hobby project I wrote for my own amusement. A few coding standards have been knowingly broken:
  - Extremely terse CSS names.
  - Using DOM elements without selecting them in JS.
