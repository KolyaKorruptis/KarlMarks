//open links from the extension's action popup
const popupLinkTargets = () => {
  if(location.hash == '#popup') {
    const links = document.querySelectorAll('.linklist__itemLink')
    links.forEach(el => {
      el.setAttribute('target','_blank')
    })
    main.style.borderRadius = 0
  }
}
popupLinkTargets()