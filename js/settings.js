// open settings view
settingsButton.addEventListener('click', () => settings.toggleAttribute('open'))

const settingsLoaderFunctions = []

// --------------------load and save settings----------------------
const saveSetting = async(key, value) => {
  const settings = await depot.get('sp-settings') || {}
  settings[key] = value
  await depot.set('sp-settings', settings)
}
const getSetting = async(key) => (await depot.get('sp-settings') || {})[key]

const loadAllSettings = async(str) => {
  await depot.set('sp-settings', JSON.parse(str).settings)
  for (let i = 0; i < settingsLoaderFunctions.length; i++) {
    settingsLoaderFunctions[i]()
  }
}


// -----------------light/dark mode------------------------
const lightModeOn = () => lightSheet.setAttribute('href', 'css/lightMode.css')
const lightModeOff = () => lightSheet.setAttribute('href', '')
const matchSystemColorOn = () => lightSheet.setAttribute('media', '(prefers-color-scheme: light)')
const matchSystemColorOff = () => lightSheet.setAttribute('media', '')

const colorModeHandler = ({ mode }) => {
  let selectedColorMode = mode || document.querySelector('.settings__colorMode[name="colorMode"]:checked').value
  if (selectedColorMode === 'system') {
    lightModeOn()
    matchSystemColorOn()
  } else if (selectedColorMode === 'light') {
    lightModeOn()
    matchSystemColorOff()
  } else if (selectedColorMode === 'dark') {
    lightModeOff()
    matchSystemColorOff()
  }
  document.querySelector(`[value="${selectedColorMode}"]`).checked = true
  saveSetting('colorMode', selectedColorMode)
}

//listen to radio changes
const radios = document.querySelectorAll('input.settings__colorMode')
radios.forEach(el => el.addEventListener('change', colorModeHandler))

// load initial color mode from setting
const loadColorMode = async() => {
  const savedColorMode = await getSetting('colorMode')
  if (savedColorMode) colorModeHandler({ mode: savedColorMode })
}
loadColorMode()
//add to array of all setting loaders
settingsLoaderFunctions.push(loadColorMode)


// -----------------------sync-------------------------------
const syncToggleHandler = () => {
  const syncMode = syncToggle.checked ? 'yes':'no'
  //chrome.storage.local.set({ 'sp-sync': syncMode})
  localStorage.setItem('sp-sync', syncMode)
  setTimeout(() => {window.location.reload()}, 500)
}

syncToggle.addEventListener('change', syncToggleHandler)

// load initial syncMode from setting
const loadSyncMode = () => {
  //const savedSyncMode = chrome.storage.local.get(['sp-sync'])
  const savedSyncMode = localStorage.getItem('sp-sync')
  if (savedSyncMode) syncToggle.checked = savedSyncMode == 'yes' ? true:false
  else localStorage.setItem('sp-sync', 'yes')
  //else chrome.storage.local.set({ 'sp-sync': 'yes'})
}
loadSyncMode()

//------------------delete data--------------------------------
const clearLocalData = () => {
  localStorage.clear()
  chrome.storage.local.clear()
  window.location.reload()
}

const clearSyncData = () => {
  chrome.storage.sync.clear()
  window.location.reload()
}

delLocal.addEventListener('click',clearLocalData)
delSync.addEventListener('click',clearSyncData)
