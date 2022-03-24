
//backup
const getBackup = async() => {
  const el = document.createElement('a')
  const links = JSON.stringify(await depot.get('sp-links')) || '[]'
  const settings = JSON.stringify(await depot.get('sp-settings')) || '{}'
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
    loadAllSettings(str)
  })
  reader.readAsText(file)
})