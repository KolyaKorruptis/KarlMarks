// open settings view
settingsButton.addEventListener('click', () => settings.toggleAttribute('open'))

// --------------------load and save settings----------------------
const saveSetting = (key, value) => {
  const settings = JSON.parse(localStorage.getItem('km-settings')) || {}
  settings[key] = value
  localStorage.setItem('km-settings', JSON.stringify(settings))
}
const loadSetting = (key) => (JSON.parse(localStorage.getItem('km-settings')) || {})[key] || null



// -----------------light/dark mode setting------------------------
const lightModeOn = () => lightSheet.setAttribute('href', 'css/lightMode.css')
const lightModeOff = () => lightSheet.setAttribute('href', '')
const matchSystemColorOn = () => lightSheet.setAttribute('media', '(prefers-color-scheme: light)')
const matchSystemColorOff = () => lightSheet.setAttribute('media', '')

const changeColorMode = ({mode}) => {
  let selectedColorMode = mode || document.querySelector('.colorMode[name="colorMode"]:checked').value
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
const radios = document.querySelectorAll('input.colorMode')
radios.forEach(el => el.addEventListener('change', changeColorMode))

// load initial color mode from setting
const savedColorMode = loadSetting('colorMode')
if (savedColorMode) changeColorMode({mode:savedColorMode})

