This repo contains a custom browser startpage with a simple bookmark system. It is intended to be used as a replacement for the new-tab-page provided by the browser.

 ## Features
  - bright and dark mode based on system setting
  - bookmarks are stored in localstorage
  - bookmarks can be downloaded and uploaded for sharing between browsers and systems
  - bookmark icons are retrieved from google
  - mobile and desktop supported
  - all in one file for optimized caching
## Live URL
http://kolya.schwarzsilber.de/startpage

## Usage
If you use the live url you will get automatic updates as development continues.
Or you can download the file in the repository and place it anywhere (including on the local system). You can still update it manually, simply by replacing the file.

You will probably want to use an extension to set this as your new-tab-page:

  - Firefox: [New Tab Override](https://addons.mozilla.org/en-US/firefox/addon/new-tab-override/)
  - Chrome: [New Tab Redirect](https://chrome.google.com/webstore/detail/new-tab-redirect/icpgjfneehieebagbmdbhnlpiopdcmna)

## Notes
This is a hobby project I wrote for my own amusement. A few coding standards have been knowingly broken:
  - Extremely terse CSS class names and IDs would be bad for collaboration, but I don't expect any.
  - Using IDs in JS without selection might run the risk of anything overwriting them, but I plan on keeping this page autonomous.
