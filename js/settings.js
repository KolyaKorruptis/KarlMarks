// open settings view
settingsButton.addEventListener('click', () => settings.toggleAttribute('open'))

const settingsLoaderFunctions = []

// --------------------load and save settings----------------------
const saveSetting = (key, value) => {
  const settings = JSON.parse(localStorage.getItem('sp-settings')) || {}
  settings[key] = value
  localStorage.setItem('sp-settings', JSON.stringify(settings))
}
const getSetting = (key) => (JSON.parse(localStorage.getItem('sp-settings')) || {})[key] || null


const loadAllSettings = (str) => {
  localStorage.setItem('sp-settings', JSON.stringify(JSON.parse(str).settings))
  for (let i = 0; i < settingsLoaderFunctions.length; i++) {
    settingsLoaderFunctions[i]()
  }
}


// -----------------light/dark mode setting------------------------
const lightModeOn = () => lightSheet.setAttribute('href', 'css/lightMode.css')
const lightModeOff = () => lightSheet.setAttribute('href', '')
const matchSystemColorOn = () => lightSheet.setAttribute('media', '(prefers-color-scheme: light)')
const matchSystemColorOff = () => lightSheet.setAttribute('media', '')

const changeColorMode = ({ mode }) => {
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
radios.forEach(el => el.addEventListener('change', changeColorMode))

// load initial color mode from setting
const loadColorMode = () => {
  const savedColorMode = getSetting('colorMode')
  if (savedColorMode) changeColorMode({ mode: savedColorMode })
}
loadColorMode()
//add to array of all setting loaders
settingsLoaderFunctions.push(loadColorMode)
