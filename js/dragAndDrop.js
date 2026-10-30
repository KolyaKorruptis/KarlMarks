let dragSrcEl

// in manage mode the title and the grab bar move an entry, otherwise nothing is draggable
linklist.addEventListener('dragstart', (e) => {
  if (manageToggle.checked && e.target.closest('.linklist__itemLink, .linklist__itemMoveHandle')) {
    dragSrcEl = e.target.closest('.linklist__item')
    const rect = dragSrcEl.getBoundingClientRect()
    e.dataTransfer.setDragImage(dragSrcEl, e.clientX - rect.left, e.clientY - rect.top)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', '')
  } else e.preventDefault()
})

linklist.addEventListener('dragover', (e) => {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
})

// mark the entry the dragged one would be put in front of, unmark everything when dragged outside
const clearOver = (keep) => linklist.querySelectorAll('.over').forEach((el) => {
  if (el !== keep) el.classList.remove('over')
})
window.addEventListener('dragenter', (e) => {
  const target = e.target.closest?.('.linklist__item')
  clearOver(target)
  if (target && dragSrcEl) target.classList.add('over')
})

linklist.addEventListener('drop', (e) => {
  e.preventDefault()
  const target = e.target.closest('.linklist__item')
  if (target && dragSrcEl && target != dragSrcEl) {
    target.before(dragSrcEl)
    save()
  }
})

linklist.addEventListener('dragend', () => {
  clearOver()
  dragSrcEl = null
})
