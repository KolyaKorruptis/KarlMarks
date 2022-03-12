// end modifying (and everything else) and clean up the stage
const reset = (e, m) => {
  if (e) e.preventDefault()
  newLink__title.value = ''
  newLink__url.value = ''
  newLink__icon.value = ''
  newLink__iconPick.value = ''
  newLink__options.removeAttribute('open')
  newLink__save.removeEventListener('click', modifyItemFromLinkForm)
  newLink__save.addEventListener('click', addNewItemFromLinkForm)
  linkAdm__title.innerHTML = 'Add New Link'
  drop2edit.style.display = 'block'
  settings.removeAttribute('open')
  if (!m) manageToggle.checked = false
}

document.addEventListener('click', (e) => {
  if (!main.contains(e.target)) reset()
  if (e.target.matches('#manageToggle:checked~#manageToggle__label')) reset(null, true)
})

// abstracting away storage
const depot = {
  set: (key, value) => {
    localStorage.setItem(key, JSON.stringify(value))
  },
  get: (key) => {
    return JSON.parse(localStorage.getItem(key))
  }
}



// const depot = {
//   set: (key, value) => {
//     const sync = chrome.storage.local.get(['sp-sync'])
//     if (sync && sync == 'no') //syncStore(key, value, 'local') //chrome.storage.local.set({ key: value })
//     else //syncStore(key, value, 'sync') //chrome.storage.sync.set({ key: value })
//   },
//   get: (key) => {
//     const sync = chrome.storage.local.get(['sp-sync'])
//     if (sync && sync == 'no') //syncGet(key, 'local') //chrome.storage.local.get([key])
//     else //syncGet(key, 'sync') //chrome.storage.sync.get([key])
//   }
// }



// Just trying to save to chrome.storage we'll get the error: QUOTA_BYTES_PER_ITEM quota exceeded
// Hence the data must be partitioned, saved into multiple storage items, and sewn back together when retrieving it
// Thank Google for that 8192 bytes limit
// The following is modified from https://stackoverflow.com/a/68427736/1225787

// const syncStore = (key, value, method) => {
//   let jsonstr = JSON.stringify(value)
//   let i = 0
//   const storageObj = {}

//   // split jsonstr into chunks and store them in an object indexed by `key_i`
//   while (jsonstr.length > 0) {

//     let index = key + "_" + i++
//     // since the key uses up some per-item quota, see how much is left for the value
//     // also trim off 2 for quotes added by storage-time `stringify`
//     const maxLength = chrome.storage[method].QUOTA_BYTES_PER_ITEM - index.length - 2
//     let valueLength = jsonstr.length
//     if (valueLength > maxLength) valueLength = maxLength

//     // trim down segment so it will be small enough even when run through `JSON.stringify` again at storage time
//     // max try is QUOTA_BYTES_PER_ITEM to avoid infinite loop
//     let segment = jsonstr.substr(0, valueLength)
//     for (let i = 0; i < chrome.storage[method].QUOTA_BYTES_PER_ITEM; i++) {
//       const jsonLength = JSON.stringify(segment).length
//       if (jsonLength > maxLength) segment = jsonstr.substr(0, --valueLength)
//       else break
//     }
//     storageObj[index] = segment
//     jsonstr = jsonstr.substr(valueLength)
//   }
//   // store all the chunks
//   chrome.storage[method].set(storageObj)
// }

// const syncGet = (key, method) => {
//   chrome.storage[method].get(key, (data) => {
//     console.log('data:')
//     console.log(data)
//     if (data != undefined && data != "undefined" && data != {} && data[key] != undefined && data[key] != "undefined") {
//       const keyArr = new Array()
//       for (let i = 0; i <= data[key].count; i++) keyArr.push(`${data[key].prefix}${i}`)
//       chrome.storage[method].get(keyArr, (items) => {
//         const keys = Object.keys(items);
//         const length = keys.length
//         let results = ''
//         if (length > 0) {
//           const sepPos = keys[0].lastIndexOf('_')
//           const prefix = keys[0].substring(0, sepPos)
//           for (let x = 0; x < length; x++) {
//             results += items[`${prefix}_${x}`]
//           }
//           console.log(JSON.parse(results))
//           return JSON.parse(results)
//         }
//       })
//     }
//   })
// }