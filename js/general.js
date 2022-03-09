// end modifying (and everything else) and clean up the stage
const reset = (e,m) => {
  if (e) e.preventDefault()
  newLink__title.value = ''
  newLink__url.value   = ''
  newLink__icon.value  = ''
  newLink__iconPick.value = ''
  newLink__options.removeAttribute('open')
  newLink__save.removeEventListener('click', modifyItemFromLinkForm)
  newLink__save.addEventListener('click', addNewItemFromLinkForm)
  linkAdm__title.innerHTML='Add New Link'
  drop2edit.style.display = 'block'
  settings.removeAttribute('open')
  if (!m) manageToggle.checked = false
}

document.addEventListener('click', (e)=>{
  if(!main.contains(e.target)) reset()
  if(e.target.matches('#manageToggle:checked~#manageToggle__label')) reset(null,true)
})

//abstracting away localStorage/chrome.storage differences
// const depot = {
//   set: (key,value) => {
//     const syncDisabled = getSetting('syncDisabled')
//     if(syncDisabled) return localStorage.setItem(key, JSON.stringify(value))
//     else return chrome.storage.sync.set({key: value})
//   },
//   get: (key) => {
//     const syncDisabled = getSetting('syncDisabled')
//     if(syncDisabled) return JSON.parse(localStorage.getItem(key))
//     else return chrome.storage.sync.get(['key'])
//   }
// }