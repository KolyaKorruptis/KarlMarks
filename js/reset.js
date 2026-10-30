const pageReload = (delay) => setTimeout(() => {window.location.reload()}, delay || 500)

// the entry currently being modified, null when adding a new one
let editTarget = null

// end modifying (and everything else) and clean up the stage
const reset = (keepManageOpen) => {
  newLink__title.value = ''
  newLink__url.value = ''
  newLink__url.setCustomValidity('')
  linkAdm__title.innerHTML = 'Add New Link'
  editTarget = null
  settings.removeAttribute('open')
  if (!keepManageOpen) manageToggle.checked = false
}
