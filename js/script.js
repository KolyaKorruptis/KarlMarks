//open links from the extension's action popup
const popupLinkTargets = () => {
  if(location.hash == '#popup') {
    const links = document.querySelectorAll('.linklist__itemLink')
    links.forEach(el => {
      el.setAttribute('target','_blank')
    })
  }
}


//--------------------Drag & Drop------------------------------
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

// drop2Edit
const d2e_dragEnter = (e) => e.target.classList.add('over')
const d2e_dragLeave = (e) => e.target.classList.remove('over')
let modifyItemFromLinkForm
const _modifyItemFromLinkForm = (elToBeReplaced) => {
  addNewItem(url.value, title.value, icon.value, iconPick.files[0],elToBeReplaced)
  title.value = ''
  url.value   = ''
  icon.value  = ''
  iconPick.value = ''
  manageToggle.checked = false
  options.removeAttribute('open')
  add.removeEventListener('click', modifyItemFromLinkForm)
  add.addEventListener('click', addNewItemFromLinkForm)
  newLinkArea.querySelector('h2').innerHTML='Add New link'
  save()
}

const d2e_drop = (e) => {
  if (e.stopPropagation) e.stopPropagation()
  newLinkArea.querySelector('h2').innerHTML='Modify Link'
  drop2Edit.classList.remove('over')
  options.setAttribute('open','')
  const doc = new DOMParser().parseFromString(e.dataTransfer.getData('text/html'), "text/html")
  title.value = doc.querySelector('.linklist__itemTitle').innerHTML
  url.value   = doc.querySelector('.linklist__itemLink').getAttribute('href')
  icon.value  = doc.querySelector('.linklist__itemIcon').getAttribute('src')
  add.removeEventListener('click', addNewItemFromLinkForm)
  modifyItemFromLinkForm = () => _modifyItemFromLinkForm(dragSrcEl)
  add.addEventListener('click', modifyItemFromLinkForm)
  return false
}

drop2Edit.addEventListener('dragover', dragOver)
drop2Edit.addEventListener('dragenter', d2e_dragEnter)
drop2Edit.addEventListener('dragleave', d2e_dragLeave)
drop2Edit.addEventListener('drop', d2e_drop)

//open Manage when dragging a link across
manageToggle__label.addEventListener('dragenter', ()=> manageToggle.checked = true)

//----------------------Link Handling-----------------------

//data to be saved
const getLinksFromHtml = () => {
  const arr = []
  linklist.querySelectorAll('.linklist__item').forEach((el) => {
    arr.push ( {"link":el.querySelector('.linklist__itemLink').href,"title":el.querySelector('.linklist__itemTitle').innerHTML,"icon":el.querySelector('.linklist__itemIcon').src} )
  })
  return JSON.stringify(arr.reverse())
}

const save = () => {
  localStorage.setItem('sp-links', getLinksFromHtml())
  popupLinkTargets()
}
const fragmentFromString = (strHTML) => document.createRange().createContextualFragment(strHTML);
const noWWW = (str) => str.replace("www.", "")

//add new item from json or form
const addNewItem = (loadUrl,loadTitle,loadIconUrl,file,elToBeReplaced=null) => {
  const realUrl = new URL(loadUrl)
  const realTitle = loadTitle || noWWW(realUrl.hostname)
  let realIcon = loadIconUrl || `https://www.google.com/s2/favicons?sz=32&domain_url=${realUrl.host}`
  const prependLink = () => {
    const frag = fragmentFromString(`
    <li class=linklist__item>
      <button class=linklist__itemDeleteButton title="Delete this entry">×</button>
      <a class=linklist__itemLink href="${realUrl}">
        <img class=linklist__itemIcon src="${realIcon}">
        <span class=linklist__itemTitle>${realTitle}</span>
      </a>
      <i draggable=true class=linklist__itemMoveHandle title="Drag this entry to another position"></i>
    </li>`)
    addDnDHandlers(frag.querySelector('li'))
    itemDeleteHandler(frag.querySelector('.linklist__itemDeleteButton'))
    if(elToBeReplaced) elToBeReplaced.replaceWith(frag)
    else linklist.prepend(frag)
  }
  // user selected a local image as icon
  if (file) {
    const promise = getLocalImageAsDataUri()
    promise.then(dataUri => realIcon = dataUri).catch().finally(() => {
      prependLink()
      save()
    })
  } else {
    prependLink()
    save()
  }
}

const getLocalImageAsDataUri = () => {
  return new Promise(function(resolve) {
    const file = iconPick.files[0]
    const reader = new FileReader()
    reader.addEventListener('load', function () {
      const image = new Image()
      image.crossOrigin = ''
      image.addEventListener('load',() => {
        const canvas = document.createElement('canvas')
        canvas.width = 22
        canvas.height = 22
        const ratio = image.naturalWidth / image.naturalHeight
        const width = canvas.width
        const height = width / ratio
        canvas.getContext('2d').drawImage(image, 0, 0, width, height)
        resolve(canvas.toDataURL('image/png'))
      })
      image.src = reader.result
    })
    reader.readAsDataURL(file)
  })
}

//deleting items
const itemDeleteHandler = (x) => {
  x.addEventListener('click', (e) => {
    e.currentTarget.parentElement.remove()
    save()
  })
}
document.querySelectorAll('.linklist__itemDeleteButton').forEach((x) => itemDeleteHandler(x))

//new link form
const addNewItemFromLinkForm = () => {
  addNewItem(url.value, title.value, icon.value, iconPick.files[0])
  title.value = ''
  url.value   = ''
  icon.value  = ''
  iconPick.value = ''
  manageToggle.checked = false
}
//add new item via save button
add.addEventListener('click', addNewItemFromLinkForm)

//also add new item via return key
manageToggle.addEventListener('change', (e) => {
  if (e.currentTarget.checked) {
    url.focus()
    newLinkArea.addEventListener('keydown', (e) => {
      if (event.keyCode == 13) addNewItemFromLinkForm()
    })
  } else save()
})

//disable autocomplete on mobile devices
if (window.innerWidth < 600) url.setAttribute( "autocomplete", "off" );

//loading links from localstorage json or file
const loadLinks = (str) => {
  const links = str? JSON.parse(str) : JSON.parse(localStorage.getItem('sp-links'))
  if (links) {
    linklist.innerHTML = ''
    links.forEach((link) => {
      addNewItem(link.link, link.title, link.icon)
    })
  }
}
loadLinks()
popupLinkTargets()

//backup
const getBackup = () => {
  const el = document.createElement('a');
  el.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(localStorage.getItem('sp-links')))
  el.setAttribute('download', 'KarlMarks.json')
  el.style.display = 'none'
  document.body.appendChild(el)
  el.click()
  document.body.removeChild(el)
}
backup.addEventListener('click', getBackup)

//import
const sel = document.getElementById('import');
sel.addEventListener('change', (event) => {
  let str = ''
  const file = event.target.files[0];
  const reader = new FileReader()
  reader.addEventListener('load', event => {
    str = event.target.result
    loadLinks(str)
    save()
  })
  reader.readAsText(file)
})
