// links are stored bottom to top as {link, title}, titles as HTML (escaped text)
// older data and backups may also carry an icon per link, it is ignored and dropped on the next save
const defaultLinks = [
  {"link":"https://github.com/KolyaKorruptis/KarlMarks","title":"Karl Marks on Github"},
  {"link":"https://www.bing.com/images/","title":"Bing Images"},
  {"link":"https://www.google.com/","title":"Google"}
]

const escText = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const escAttr = (str) => str.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
const noWWW = (str) => str.replace("www.", "")

// icons come from the browser's own favicon cache
const favicon = (url) => `/_favicon/?pageUrl=${encodeURIComponent(url)}&size=32`

const itemHtml = ({link, title}) => `
  <li class=linklist__item>
    <button class=linklist__itemEditButton title="Edit">✎</button>
    <a class=linklist__itemLink href="${escAttr(link)}">
      <img class=linklist__itemIcon src="${escAttr(favicon(link))}">
      <span class=linklist__itemTitle>${title}</span>
    </a>
    <i draggable=true class=linklist__itemMoveHandle title="Reorder"></i>
    <button class=linklist__itemDeleteButton title="Delete">×</button>
  </li>`

const renderLinks = (links) => linklist.innerHTML = links.map(itemHtml).reverse().join('')

//data to be saved
const getLinksFromHtml = () => {
  const arr = []
  linklist.querySelectorAll('.linklist__item').forEach((el) => {
    arr.push ( {"link":el.querySelector('.linklist__itemLink').href,"title":el.querySelector('.linklist__itemTitle').innerHTML} )
  })
  return arr.reverse()
}

const save = async() => {
  const links = getLinksFromHtml()
  localStorage.links = JSON.stringify(links)
  await depot.set('sp-links', links)
}

//add a new item or replace the one being edited with the form's content
const saveLinkForm = () => {
  let url = newLink__url.value.trim()
  if (url && !/^[a-z][\w+.-]*:\/\/|^(about|mailto|tel):/i.test(url)) url = 'https://' + url
  try { url = new URL(url) } catch {
    newLink__url.setCustomValidity('Please enter a valid URL')
    newLink__url.reportValidity()
    return
  }
  const html = itemHtml({
    link: url.href,
    title: escText(newLink__title.value.trim()) || noWWW(url.hostname) || url.href
  })
  if (editTarget) editTarget.outerHTML = html
  else linklist.insertAdjacentHTML('afterbegin', html)
  reset()
  save()
}
newLink__save.addEventListener('click', saveLinkForm)
newLink__url.addEventListener('input', () => newLink__url.setCustomValidity(''))

//also save via return key
linkAdm.addEventListener('keydown', (e) => {
  if (e.key == 'Enter' && e.target.type == 'text') saveLinkForm()
})

// prepare the stage for modifying an entry
const editItem = (item) => {
  editTarget = item
  linkAdm__title.innerHTML = 'Modify Link'
  newLink__title.value = item.querySelector('.linklist__itemTitle').textContent
  newLink__url.value = item.querySelector('.linklist__itemLink').getAttribute('href')
  newLink__url.focus()
}

//deleting and editing items
linklist.addEventListener('click', (e) => {
  const item = e.target.closest('.linklist__item')
  if (e.target.matches('.linklist__itemDeleteButton')) {
    if (item == editTarget) reset(true)
    item.remove()
    save()
  } else if (e.target.matches('.linklist__itemEditButton')) editItem(item)
})

// in manage mode links are only for dragging, not for opening
const blockLinksWhileManaging = (e) => {
  if (manageToggle.checked && e.target.closest('.linklist__itemLink')) e.preventDefault()
}
linklist.addEventListener('click', blockLinksWhileManaging)
linklist.addEventListener('auxclick', blockLinksWhileManaging)

manageToggle.addEventListener('change', (e) => {
  if (e.currentTarget.checked) newLink__url.focus()
  else reset(true)
})

// paint the links mirrored in localStorage right away, then catch up with the data store
let shownLinks = localStorage.links
renderLinks(shownLinks ? JSON.parse(shownLinks) : defaultLinks)

const loadLinks = async() => {
  const links = await depot.get('sp-links')
  const json = links && JSON.stringify(links)
  if (json == shownLinks) return
  renderLinks(links || defaultLinks)
  if (json) localStorage.links = shownLinks = json
  else localStorage.removeItem('links')
}
loadLinks()

//import links from a backup file
const importLinks = (links) => {
  renderLinks(links)
  save()
}
