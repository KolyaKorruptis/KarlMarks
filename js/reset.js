const pageReload = (delay) => setTimeout(() => {window.location.reload()}, delay || 500)

// end modifying (and everything else) and clean up the stage
const reset = (e, m) => {
  if (e) e.preventDefault()
  newLink__title.value = ''
  newLink__url.value = ''
  newLink__icon.value = ''
  newLink__iconPick.value = ''
  newLink__options.removeAttribute('open')
  newLink__save.removeEventListener('click', modifyItemFromLinkForm)
  newLink__save.addEventListener('click', addNewItemFromLinkForm)
  linkAdm__title.innerHTML = 'Add New Link'
  drop2edit.style.display = 'block'
  settings.removeAttribute('open')
  if (!m) manageToggle.checked = false
}

document.addEventListener('click', (e) => {
  if (e.target.matches('#manageToggle:checked~#manageToggle__label')) reset(null, true)
})


