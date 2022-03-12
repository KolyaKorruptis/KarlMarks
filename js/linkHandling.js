//data to be saved
const getLinksFromHtml = () => {
  const arr = []
  linklist.querySelectorAll('.linklist__item').forEach((el) => {
    arr.push ( {"link":el.querySelector('.linklist__itemLink').href,"title":el.querySelector('.linklist__itemTitle').innerHTML,"icon":el.querySelector('.linklist__itemIcon').src} )
  })
  return arr.reverse()
}

const save = () => {
  depot.set('sp-links', getLinksFromHtml())
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
    const file = newLink__iconPick.files[0]
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
  addNewItem(newLink__url.value, newLink__title.value, newLink__icon.value, newLink__iconPick.files[0])
  newLink__title.value = ''
  newLink__url.value   = ''
  newLink__icon.value  = ''
  newLink__iconPick.value = ''
  manageToggle.checked = false
}
//add new item via save button
newLink__save.addEventListener('click', addNewItemFromLinkForm)

//also add new item via return key
manageToggle.addEventListener('change', (e) => {
  if (e.currentTarget.checked) {
    newLink__url.focus()
    linkAdm.addEventListener('keydown', (e) => {
      if (event.keyCode == 13) addNewItemFromLinkForm()
    })
  } else save()
})

//disable autocomplete on mobile devices
if (window.innerWidth < 600) newLink__url.setAttribute( "autocomplete", "off" );

//loading links from localstorage json or file
const loadLinks = (str) => {
  const links = str? JSON.parse(str).links : depot.get('sp-links')
  if (links) {
    linklist.innerHTML = ''
    links.forEach((link) => {
      addNewItem(link.link, link.title, link.icon)
    })
  }
}
loadLinks()


//backup
const getBackup = () => {
  const el = document.createElement('a')
  const links = JSON.stringify(depot.get('sp-links')) || '[]'
  const settings = JSON.stringify(depot.get('sp-settings')) || '{}'
  el.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(`{"links":${links},"settings":${settings}}`))
  el.setAttribute('download', 'KarlMarks.json')
  el.style.display = 'none'
  document.body.appendChild(el)
  el.click()
  document.body.removeChild(el)
}
backupButton.addEventListener('click', getBackup)

//import
const sel = document.getElementById('import')
sel.addEventListener('change', (event) => {
  let str = ''
  const file = event.target.files[0];
  const reader = new FileReader()
  reader.addEventListener('load', event => {
    str = event.target.result
    //backward compatibility
    const json = JSON.parse(str)
    if (!json.links) str = `{"links":${JSON.stringify(json)},"settings":{}}`
    //end backward compatibility
    loadLinks(str)
    save()
    loadAllSettings(str)
  })
  reader.readAsText(file)
})


