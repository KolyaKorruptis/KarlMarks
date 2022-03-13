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
  if (document.contains(e.target) && !main.contains(e.target)) reset()
  if (e.target.matches('#manageToggle:checked~#manageToggle__label')) reset(null, true)
})

//abstracting away storage
// const depot = {
//   set: (key, value) => {
//     localStorage.setItem(key, LZStringUnsafe.compress(JSON.stringify(value)))
//   },
//   get: (key) => {
//     return JSON.parse(LZStringUnsafe.decompress(localStorage.getItem(key)))
//   }
// }

// promisified chrome.storage
const depot = {
  set: async(key, value) => {
    return new Promise(function (resolve) {
      chrome.storage.local.set({ [key]: value }, function () {
        resolve(value)
      })
    })
  },
  get: async(key) => {
    return new Promise(function (resolve) {
      chrome.storage.local.get([key], function (result) {
        if (result[key] === undefined) reject()
        else resolve(result[key])
      })
    })
  }
}




// Just trying to save to chrome.storage we'll get the error: QUOTA_BYTES_PER_ITEM quota exceeded
// Hence the data must be partitioned, saved into multiple storage items, and sewn back together when retrieving it
// Thank Google for that 8192 bytes limit
// The following is modified from https://stackoverflow.com/a/67429150

function chunkedWrite(key, value) {
  //console.log(new Error().stack)
  return new Promise(resolve => {
    if (typeof key !== 'string') key = `${key}`
    const str = JSON.stringify(value) // consider using LZString's compressToUTF16

    const len = chrome.storage.sync.QUOTA_BYTES_PER_ITEM - key.length - 4
    const num = Math.ceil(str.length / len)
    const obj = {}
    obj[key + '#'] = num
    for (let i = 0; i < num; i++) {
      obj[key + i] = str.substr(i * len, len)
    }
    chrome.storage.sync.set(obj, resolve)
  })
}


function chunkedRead(key) {
  return new Promise(resolve => {
    if (typeof key !== 'string') key = `${key}`
    const keyNum = key + '#'
    chrome.storage.sync.get(keyNum, data => {
      const num = data[keyNum]
      const keys = []
      for (let i = 0; i < num; i++) {
        keys[i] = key + i
      }
      chrome.storage.sync.get(keys, data => {
        const chunks = []
        for (let i = 0; i < num; i++) {
          chunks.push(data[key + i] || '')
        }
        const str = chunks.join('')
        resolve(str ? JSON.parse(str) : undefined)
      })
    })
  })
}