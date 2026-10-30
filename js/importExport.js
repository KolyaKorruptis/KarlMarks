
//backup
const getBackup = async() => {
  const el = document.createElement('a')
  // without icons that older versions may have left in storage
  const links = JSON.stringify(cleanLinks(await depot.get('sp-links') || []))
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
document.getElementById('import').addEventListener('change', async(event) => {
  const json = JSON.parse(await event.target.files[0].text())
  importLinks(json.links || [])
  loadAllSettings(json.settings)
})
