const pageReload = (delay) => setTimeout(() => {window.location.reload()}, delay || 500)

// the entry currently being modified, null when adding a new one
let editTarget = null

// the inputs' text quickly fades in when an entry gets selected or put back
// no bounce like the pen tilting in the list: a color can't overshoot, the bounce would just cut the fade short
const fadeIn = (el, pseudoElement) => el.animate([{color:'transparent'},{}], {duration:300, easing:'ease-out', pseudoElement})
const fadeInputs = () => {
  for (const input of [newLink__url, newLink__title]) {
    fadeIn(input)
    fadeIn(input, '::placeholder')
  }
}

// end modifying (and everything else) and clean up the stage
const reset = (keepManageOpen) => {
  newLink__title.value = ''
  newLink__url.value = ''
  newLink__url.setCustomValidity('')
  linkAdm__title.innerHTML = 'Add New Link'
  if (editTarget) fadeInputs()
  linkAdm.classList.remove('renaming')
  editTarget?.classList.remove('editing')
  editTarget = null
  settings.removeAttribute('open')
  if (!keepManageOpen) manageToggle.checked = false
}
