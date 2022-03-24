//data to be saved
const getLinksFromHtml = () => {
  const arr = []
  linklist.querySelectorAll('.linklist__item').forEach((el) => {
    arr.push ( {"link":el.querySelector('.linklist__itemLink').href,"title":el.querySelector('.linklist__itemTitle').innerHTML,"icon":el.querySelector('.linklist__itemIcon').src} )
  })
  return arr.reverse()
}

const save = async() => {
  await depot.set('sp-links', getLinksFromHtml())
  popupLinkTargets()
}
const fragmentFromString = (strHTML) => document.createRange().createContextualFragment(strHTML);
const noWWW = (str) => str.replace("www.", "")

//add new item from json or form
const addNewItem = ({loadUrl,loadTitle,loadIconUrl,file,elToBeReplaced=null,doNotSave}) => {
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
      if(!doNotSave) save()
    })
  } else {
    prependLink()
    if(!doNotSave) save()
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
  addNewItem({loadUrl:newLink__url.value, loadTitle:newLink__title.value, loadIconUrl:newLink__icon.value, file:newLink__iconPick.files[0]})
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

//loading links from storage or file
const loadLinks = async(str) => {
  let links = str? JSON.parse(str).links : await depot.get('sp-links')
  // backward compatibility
  if (!links) {
    links = JSON.parse(localStorage.getItem('sp-links'))
    localStorage.clear()
  }
  //end backward compatibility
  if (links) {
    linklist.innerHTML = ''
    links.forEach((link) => {
      addNewItem({loadUrl:link.link, loadTitle:link.title, loadIconUrl:link.icon, doNotSave:true})
    })
    save()
  }
}
loadLinks()




