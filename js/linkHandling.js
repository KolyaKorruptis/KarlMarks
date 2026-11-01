// links are stored bottom to top as {link, title}, titles as HTML (escaped text)
// groups are stored as {title, open, links}, their links bottom to top as well
// older data and backups may also carry an icon per link, it is ignored and dropped on the next save
const defaultLinks = [
  {"link":"https://github.com/KolyaKorruptis/KarlMarks","title":"Karl Marks on Github"},
  {"link":"https://duckduckgo.com/","title":"DuckDuckGo"},
  {"link":"https://mastodon.social/","title":"Mastodon.social"}
]

const escText = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const escAttr = (str) => str.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
const noWWW = (str) => str.replace("www.", "")

// icons come from the browser's own favicon cache
const favicon = (url) => `/_favicon/?pageUrl=${encodeURIComponent(url)}&size=32`

const itemHtml = ({link, title, open, links}) => links ? `
  <li class="linklist__item linklist__group${open ? ' open' : ''}">
    <button class=linklist__itemEditButton title="Rename"></button>
    <span class=linklist__itemLink draggable=true>
      <i class=linklist__groupArrow></i>
      <span class=linklist__itemTitle>${title}</span>
    </span>
    <i draggable=true class=linklist__itemMoveHandle></i>
    <button class=linklist__itemDeleteButton title="Ungroup"></button>
    <ul class=linklist__groupList>${listHtml(links)}</ul>
  </li>` : `
  <li class=linklist__item>
    <button class=linklist__itemEditButton title="Edit"></button>
    <a class=linklist__itemLink href="${escAttr(link)}">
      <img class=linklist__itemIcon src="${escAttr(favicon(link))}">
      <span class=linklist__itemTitle>${title}</span>
    </a>
    <i draggable=true class=linklist__itemMoveHandle></i>
    <button class=linklist__itemDeleteButton title="Delete"></button>
  </li>`

const listHtml = (links) => links.map(itemHtml).reverse().join('')
const renderLinks = (links) => linklist.innerHTML = listHtml(links)

const isGroup = (el) => el.classList.contains('linklist__group')
const groupList = (group) => group.querySelector('.linklist__groupList')

//data to be saved
const getLinksFromHtml = (list = linklist) => [...list.children].map((el) => isGroup(el)
  ? {"title":el.querySelector('.linklist__itemTitle').innerHTML,"open":el.classList.contains('open'),"links":getLinksFromHtml(groupList(el))}
  : {"link":el.querySelector('.linklist__itemLink').href,"title":el.querySelector('.linklist__itemTitle').innerHTML}
).reverse()

// only what belongs into storage or a backup, older versions also stored icons
const cleanLinks = (links) => links.map((item) => item.links
  ? {"title":item.title,"open":!!item.open,"links":cleanLinks(item.links)}
  : {"link":item.link,"title":item.title})

// a group with a single link left dissolves into that link, an empty one disappears
const tidyGroups = () => linklist.querySelectorAll('.linklist__group').forEach((group) => {
  const items = groupList(group).children
  if (items.length > 1) return
  if (group == editTarget) reset(true)
  group.replaceWith(...items)
})

// while managing, changes only live on the page: Save keeps them, Cancel goes back to linksBeforeManaging
let linksBeforeManaging
const save = async(evenWhileManaging) => {
  tidyGroups()
  if (manageToggle.checked && !evenWhileManaging) return
  const links = getLinksFromHtml()
  localStorage.links = JSON.stringify(links)
  await depot.set('sp-links', links)
}

// put two entries into a new group in place of the first one and let the user name it
const makeGroup = (target, dragged) => {
  target.insertAdjacentHTML('beforebegin', itemHtml({title: 'New Group', open: true, links: []}))
  const group = target.previousElementSibling
  groupList(group).append(target, dragged)
  editItem(group)
}

// what the url field becomes on save: https:// added when the scheme is missing, null when invalid
const urlFromForm = () => {
  let url = newLink__url.value.trim()
  if (url && !/^[a-z][\w+.-]*:\/\/|^(about|mailto|tel):/i.test(url)) url = 'https://' + url
  try { return new URL(url) } catch { return null }
}
// the domain, numbered when a link with that title is already in the list
const defaultTitle = (url) => {
  const taken = new Set([...linklist.querySelectorAll('.linklist__itemTitle')].filter((el) => !editTarget?.contains(el)).map((el) => el.textContent.toLowerCase()))
  const base = noWWW(url.hostname) || url.href
  let title = base
  for (let n = 2; taken.has(title.toLowerCase()); n++) title = `${base} (${n})`
  return title
}

//add a new item or replace the one being edited with the form's content
const saveLinkForm = () => {
  if (editTarget && isGroup(editTarget)) {
    editTarget.querySelector('.linklist__itemTitle').innerHTML = escText(newLink__title.value.trim()) || 'Group'
    reset()
    save()
    return
  }
  // Save with an empty form just keeps the changes made while managing
  if (!newLink__url.value.trim() && !editTarget) {
    reset()
    save()
    return
  }
  const url = urlFromForm()
  if (!url) {
    newLink__url.setCustomValidity('Please enter a valid URL')
    newLink__url.reportValidity()
    return
  }
  const html = itemHtml({
    link: url.href,
    title: escText(newLink__title.value.trim()) || defaultTitle(url)
  })
  if (editTarget) editTarget.outerHTML = html
  else linklist.insertAdjacentHTML('afterbegin', html)
  reset()
  save()
}
newLink__save.addEventListener('click', saveLinkForm)
// fill in the title that will be used, until the user writes their own
let autoTitle = ''
newLink__url.addEventListener('input', () => {
  newLink__url.setCustomValidity('')
  if (newLink__title.value && newLink__title.value != autoTitle) return
  const url = urlFromForm()
  newLink__title.value = autoTitle = url ? defaultTitle(url) : ''
})

//also save via return key
linkAdm.addEventListener('keydown', (e) => {
  if (e.key == 'Enter' && e.target.type == 'text') saveLinkForm()
})

// prepare the stage for modifying an entry, groups only get a new name
const editItem = (item) => {
  editTarget = item
  const group = isGroup(item)
  linkAdm.classList.toggle('renaming', group)
  linkAdm__title.innerHTML = group ? 'Rename Group' : 'Modify Link'
  newLink__title.value = item.querySelector('.linklist__itemTitle').textContent
  newLink__url.value = group ? '' : item.querySelector('.linklist__itemLink').getAttribute('href')
  const url = !group && urlFromForm()
  autoTitle = url ? defaultTitle(url) : ''
  if (group) newLink__title.select()
  else newLink__url.focus()
}

//deleting, ungrouping, editing and expanding items
linklist.addEventListener('click', (e) => {
  const item = e.target.closest('.linklist__item')
  if (e.target.matches('.linklist__itemDeleteButton')) {
    if (item == editTarget) reset(true)
    if (isGroup(item)) item.replaceWith(...groupList(item).children)
    else item.remove()
    save()
  } else if (e.target.matches('.linklist__itemEditButton')) editItem(item)
  else if (e.target.closest('.linklist__itemLink') && isGroup(e.target.closest('.linklist__itemLink').parentElement)) {
    item.classList.toggle('open')
    save()
  }
})

// in manage mode links are only for dragging, not for opening
const blockLinksWhileManaging = (e) => {
  if (manageToggle.checked && e.target.closest('.linklist__itemLink')) e.preventDefault()
}
linklist.addEventListener('click', blockLinksWhileManaging)
linklist.addEventListener('auxclick', blockLinksWhileManaging)

manageToggle.addEventListener('change', (e) => {
  if (e.currentTarget.checked) {
    linksBeforeManaging = getLinksFromHtml()
    newLink__url.focus()
  } else {
    // Cancel
    reset(true)
    renderLinks(linksBeforeManaging)
  }
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
// imports are saved right away and become what Cancel goes back to
const importLinks = (links) => {
  renderLinks(cleanLinks(links))
  save(true)
  linksBeforeManaging = getLinksFromHtml()
}
