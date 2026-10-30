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

const loadAllSettings = async(settings) => {
  await depot.set('sp-settings', settings || {})
  for (let i = 0; i < settingsLoaderFunctions.length; i++) {
    settingsLoaderFunctions[i]()
  }
}


// -----------------light/dark mode------------------------
// theme.js already applied the mode mirrored in localStorage before the first paint
const applyColorMode = (mode) => {
  document.documentElement.dataset.theme = localStorage.colorMode = mode
  document.querySelector(`[value="${mode}"]`).checked = true
}
applyColorMode(document.documentElement.dataset.theme)

//listen to radio changes
const radios = document.querySelectorAll('input.settings__colorMode')
radios.forEach(el => el.addEventListener('change', (e) => {
  applyColorMode(e.currentTarget.value)
  saveSetting('colorMode', e.currentTarget.value)
}))

// catch up with the data store, the mode may have been changed on another device
const loadColorMode = async() => applyColorMode(await getSetting('colorMode') || 'system')
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
const loadSyncMode = async() => syncToggle.checked = await getDataStore() == 'sync'
loadSyncMode()
settingsLoaderFunctions.push(loadSyncMode)

//------------------delete data--------------------------------
const clearData = async(area) => {
  await chrome.storage[area].clear()
  localStorage.clear()
  pageReload()
}

delLocal.addEventListener('click', () => clearData('local'))
delSync.addEventListener('click', () => clearData('sync'))
