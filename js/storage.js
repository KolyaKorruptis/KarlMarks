
// every storage area is read in one go and cached until something changes in it
const storageCache = {}
const readArea = area => storageCache[area] ||= chrome.storage[area].get(null)
chrome.storage.onChanged.addListener((changes, area) => delete storageCache[area])

// 'sync' unless the user switched to 'local'
const getDataStore = async() => (await readArea('local'))['sp-dataStore'] == 'local' ? 'local' : 'sync'

// depot handles data storage
const depot = {
  set: async(key, value, store) => {
    const dataStore = store || await getDataStore()
    if (dataStore == 'local') await chrome.storage.local.set({ [key]: value })
    else await chunkedWrite(key, value)
    delete storageCache[dataStore]
  },
  get: async(key, store) => {
    const dataStore = store || await getDataStore()
    const data = await readArea(dataStore)
    return dataStore == 'local' ? data[key] : chunkedRead(data, key)
  }
}

// Simply trying to save to chrome.storage.sync we'll get the error: QUOTA_BYTES_PER_ITEM quota exceeded
// Hence the data must be partitioned into multiple storage items and sewn back together when retrieving it
// The following functions are modified from https://stackoverflow.com/a/67429150

// btoa only takes Latin1, so everything beyond ASCII is written as JSON \u escapes first
const toAscii = str => str.replace(/[\u0080-￿]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'))

async function chunkedWrite(key, value) {
  const str = btoa(toAscii(JSON.stringify(value)))
  const len = chrome.storage.sync.QUOTA_BYTES_PER_ITEM - key.length - 4
  const num = Math.ceil(str.length / len)
  const oldNum = (await readArea('sync'))[key + '#'] || 0
  const obj = {}
  obj[key + '#'] = num
  for (let i = 0; i < num; i++) {
    obj[key + i] = str.substr(i * len, len)
  }
  await chrome.storage.sync.set(obj)
  // drop chunks left over from a longer previous version, they'd eat into the sync quota
  const stale = []
  for (let i = num; i < oldNum; i++) stale.push(key + i)
  if (stale.length) await chrome.storage.sync.remove(stale)
}

function chunkedRead(data, key) {
  const num = data[key + '#']
  const chunks = []
  for (let i = 0; i < num; i++) {
    chunks.push(data[key + i] || '')
  }
  const str = chunks.join('')
  return str ? JSON.parse(atob(str)) : undefined
}
