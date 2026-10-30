let dragSrcEl

// in manage mode the title and the grab bar move an entry, otherwise nothing is draggable
linklist.addEventListener('dragstart', (e) => {
  if (manageToggle.checked && e.target.closest('.linklist__itemLink, .linklist__itemMoveHandle')) {
    dragSrcEl = e.target.closest('.linklist__item')
    // a compact drag image (icon and title) to the right of the pointer, so it doesn't cover the drop target
    const ghost = dragSrcEl.querySelector('.linklist__itemLink')
    e.dataTransfer.setDragImage(ghost, -16, ghost.offsetHeight / 2)
    // dim the original only after the browser took its snapshot for the drag image
    const src = dragSrcEl
    requestAnimationFrame(() => src.classList.add('dragging'))
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', '')
  } else e.preventDefault()
})

// where the dragged entry would land: {el, where} with where being 'before', 'after' or 'into'
// the top and bottom quarter of a row reorder, the middle half groups
// returns undefined to keep the last spot when the pointer is between rows
const findDropSpot = (e) => {
  let target = e.target.closest?.('.linklist__item')
  if (!target || !dragSrcEl) return null
  const draggingGroup = isGroup(dragSrcEl)
  // groups don't nest, a dragged group only lands next to top level entries
  if (draggingGroup && target.parentElement != linklist) target = target.parentElement.closest('.linklist__item')
  if (dragSrcEl.contains(target)) return null
  const row = (isGroup(target) ? target.querySelector('.linklist__itemLink') : target).getBoundingClientRect()
  const y = (e.clientY - row.top) / row.height
  if (y < 0 || y > 1) return
  const canGoInto = !draggingGroup && (isGroup(target) || target.parentElement == linklist)
  const where = canGoInto && y > .25 && y < .75 ? 'into' : y < .5 ? 'before' : 'after'
  // right below the header of an open group is its first entry
  const first = target.classList.contains('open') && groupList(target).firstElementChild
  if (where == 'after' && !draggingGroup && first) return {el: first, where: 'before'}
  return {el: target, where}
}

let dropSpot
const markDropSpot = (spot) => {
  if (dropSpot?.el == spot?.el && dropSpot?.where == spot?.where) return
  dropSpot?.el.classList.remove('over-' + dropSpot.where)
  dropSpot = spot
  spot?.el.classList.add('over-' + spot.where)
}

linklist.addEventListener('dragover', (e) => {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
  const spot = findDropSpot(e)
  if (spot !== undefined) markDropSpot(spot)
})

// unmark when dragged outside the list
window.addEventListener('dragenter', (e) => {
  if (!linklist.contains(e.target)) markDropSpot(null)
})

linklist.addEventListener('drop', (e) => {
  e.preventDefault()
  const spot = dropSpot
  markDropSpot(null)
  if (!spot || !dragSrcEl) return
  if (spot.where == 'before') spot.el.before(dragSrcEl)
  else if (spot.where == 'after') spot.el.after(dragSrcEl)
  else if (isGroup(spot.el)) groupList(spot.el).append(dragSrcEl)
  else makeGroup(spot.el, dragSrcEl)
  save()
})

linklist.addEventListener('dragend', () => {
  markDropSpot(null)
  dragSrcEl?.classList.remove('dragging')
  dragSrcEl = null
})
