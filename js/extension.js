//open links from the extension's action popup in new tabs
if (location.hash == '#popup') {
  document.head.insertAdjacentHTML('beforeend', '<base target=_blank>')
  main.style.borderRadius = 0
}
