let dragSrcEl

const dragStart = (e) => {
  if (e.target.classList.contains('linklist__itemMoveHandle')) {
    dragSrcEl = e.currentTarget
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML)
  } else e.preventDefault()
}

const dragOver = (e) =>{
  if (e.preventDefault) e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
  return false
}

let dragEnterTarget;

const dragEnter = (e) => {
  const target = e.target.closest('LI')
  if (target) {
    target.classList.add('over')
    dragEnterTarget = target
  } else {
    //dragged outside dropzone, cancel all meetings
    linklist.querySelectorAll('.linklist__item').forEach((el) => {
      el.classList.remove('over')
    })
  }
}

const dragLeave = (e) => {
  linklist.querySelectorAll('.linklist__item').forEach((el) => {
    if (el !== dragEnterTarget) el.classList.remove('over')
  })
}

const drop = (e) => {
  if (e.stopPropagation) e.stopPropagation()
  let dropElem
  if (dragSrcEl != e.currentTarget) {
    e.currentTarget.parentNode.removeChild(dragSrcEl)
    const dropHTML = e.dataTransfer.getData('text/html')
    e.currentTarget.insertAdjacentHTML('beforebegin',dropHTML)
    dropElem = e.currentTarget.previousSibling
    addDnDHandlers(dropElem)
  }
  e.currentTarget.classList.remove('over')
  save()
  if (dropElem) itemDeleteHandler(dropElem.querySelector('.linklist__itemDeleteButton'))
  return false
}

const addDnDHandlers = (el) => {
  el.addEventListener('dragstart', dragStart)
  el.addEventListener('dragenter', dragEnter)
  el.addEventListener('dragover', dragOver)
  el.addEventListener('dragleave', dragLeave)
  el.addEventListener('drop', drop)
}
linklist.querySelectorAll('.linklist__item').forEach((el) => {
  addDnDHandlers(el)
})
//dragged outside dropzone
window.addEventListener('dragenter', dragEnter)

//--------------------drag 2 edit------------------------------
const d2e_dragEnter = (e) => e.target.classList.add('over')
const d2e_dragLeave = (e) => e.target.classList.remove('over')
let modifyItemFromLinkForm
const _modifyItemFromLinkForm = (elToBeReplaced) => {
  addNewItem({loadUrl:newLink__url.value, loadTitle:newLink__title.value, loadIconUrl:newLink__icon.value, file:newLink__iconPick.files[0],elToBeReplaced:elToBeReplaced})
  reset()
  save()
}

// prepare the stage for modifying an entry
const d2e_start = () => {
  linkAdm__title.innerHTML='Modify Link'
  drop2edit.style.display = 'none'
  drop2edit.classList.remove('over')
  newLink__options.setAttribute('open','')
  newLink__save.removeEventListener('click', addNewItemFromLinkForm)
  modifyItemFromLinkForm = () => _modifyItemFromLinkForm(dragSrcEl)
  newLink__save.addEventListener('click', modifyItemFromLinkForm)
}

const d2e_drop = (e) => {
  if (e.stopPropagation) e.stopPropagation()
  d2e_start()
  const doc = new DOMParser().parseFromString(e.dataTransfer.getData('text/html'), "text/html")
  newLink__title.value = doc.querySelector('.linklist__itemTitle').innerHTML
  newLink__url.value   = doc.querySelector('.linklist__itemLink').getAttribute('href')
  newLink__icon.value  = doc.querySelector('.linklist__itemIcon').getAttribute('src')
  return false
}

drop2edit.addEventListener('dragover', dragOver)
drop2edit.addEventListener('dragenter', d2e_dragEnter)
drop2edit.addEventListener('dragleave', d2e_dragLeave)
drop2edit.addEventListener('drop', d2e_drop)

//open Manage when dragging a link across
manageToggle__label.addEventListener('dragenter', ()=> manageToggle.checked = true)


