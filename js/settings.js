// open/close settings view
[settingsButton, closeSettings].forEach(el=>{ el.addEventListener('click', () => settings.toggleAttribute('open')) })

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
const syncToggleHandler = async() => {
  const dataStore = syncToggle.checked ? 'sync':'local'
  await depot.set('sp-dataStore', dataStore, 'local')  //TODO Consider using an object argument to make this less confusing
  pageReload()
}

syncToggle.addEventListener('change', syncToggleHandler)

// load initial syncMode from setting
const loadSyncMode = async() => {
  const dataStore = await depot.get('sp-dataStore','local')
  if (dataStore) syncToggle.checked = dataStore == 'sync' ? true:false
  else await depot.set('sp-dataStore', 'sync', 'local') // set 'sp-dataStore' in local store (forced) to 'sync'
}
loadSyncMode()
settingsLoaderFunctions.push(loadSyncMode)

//------------------delete data--------------------------------
const clearLocalData = () => {
  chrome.storage.local.clear()
  pageReload()
}

const clearSyncData = () => {
  chrome.storage.sync.clear()
  pageReload()
}

delLocal.addEventListener('click',clearLocalData)
delSync.addEventListener('click',clearSyncData)
