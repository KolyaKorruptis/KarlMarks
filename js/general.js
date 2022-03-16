const pageReload = (delay) => setTimeout(() => {window.location.reload()}, delay || 500)

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


// depot handles data storage
const depot = {
  set: async(key, value, store) => {
    const dataStore = store || await depot.get('sp-dataStore','local')
    if (dataStore && dataStore == 'local') {
      return new Promise(function (resolve) {
        chrome.storage.local.set({ [key]: value }, function () {
          resolve(value)
        })
      })
    } else {
      return chunkedWrite(key, value)
    }
  },
  get: async(key, store) => {
    const dataStore = store || await depot.get('sp-dataStore','local')
    if (dataStore && dataStore == 'local') {
      return new Promise(function (resolve) {
        chrome.storage.local.get([key], function (result) {
          resolve(result[key])
        })
      })
    } else {
      return chunkedRead(key)
    }
  }
}

// Simply trying to save to chrome.storage.sync we'll get the error: QUOTA_BYTES_PER_ITEM quota exceeded
// Hence the data must be partitioned into multiple storage items and sewn back together when retrieving it
// The following functions are modified from https://stackoverflow.com/a/67429150

function chunkedWrite(key, value) {
  return new Promise(resolve => {
    if (typeof key !== 'string') key = `${key}`
    const str = btoa(JSON.stringify(value)) // consider using LZStringUnsafe.compress
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
        resolve(str ? JSON.parse(atob(str)) : undefined)
      })
    })
  })
}
