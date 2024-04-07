import nacl from './lib/nacl-fast-es.js'
import { decode, encode } from './lib/base64.js'
import { cachekv } from './lib/cachekv.js'

export const bogbot = {}

const generate = async () => {
  const genkey = nacl.sign.keyPair()
  const keygen = encode(genkey.publicKey) + encode(genkey.secretKey)
  return keygen
}

bogbot.keypair = async () => {
  const keypair = await localStorage.getItem('keypair')
  if (!keypair) {
    const keypair = await generate()
    await localStorage.setItem('keypair', keypair)
    location.reload()
    //return keypair
  } else {
    return keypair
  }
}

bogbot.pubkey = async () => {
  const keypair = await bogbot.keypair()
  return keypair.substring(0, 44)
}

bogbot.privkey = async () => {
  const keypair = await bogbot.keypair()
  return keypair.substring(44)
}

bogbot.deletekey = async () => {
  localStorage.removeItem('keypair')
}

bogbot.publish = async (text) => {
  const pubkey = await bogbot.pubkey()
  const privkey = await bogbot.privkey()
  const datahash = await bogbot.make(text)

  const timestamp = Date.now()

  const msg = timestamp + pubkey + datahash

  const hash = encode(
    Array.from(
      new Uint8Array(
        await crypto.subtle.digest("SHA-256", new TextEncoder().encode(msg))
      )
    )
  )

  let previous

  const getLatest = await bogbot.getLatest(pubkey)

  console.log(getLatest)

  previous = hash

  if (getLatest) {
    previous = getLatest.hash
  } else {
    previous = hash
  }

  const next = msg + previous + hash

  const sig = encode(nacl.sign(new TextEncoder().encode(next), decode(privkey)))
  return pubkey + sig
}

bogbot.open = async (msg) => {
  const opened = new TextDecoder().decode(nacl.sign.open(decode(msg.substring(44)), decode(msg.substring(0, 44))))

  const obj = {
    timestamp: parseInt(opened.substring(0, 13)),
    author: opened.substring(13, 57),
    data: opened.substring(57, 101),
    previous: opened.substring(101, 145),
    hash : opened.substring(145),
    raw: msg
  }

  const blob = await bogbot.find(obj.data)

  if (blob) {
    obj.txt = blob
  }

  return obj
}

let arraystore = []

const file = await cachekv.get('arraystore')

let newData = false

if (file) {
  arraystore = JSON.parse(file)
  newData = true
}

const sorter = setInterval(async () => {
  if (newData) {
    console.log('sorting')
    console.log(arraystore)
    const rawset = new Set()
    for await (const msg of arraystore) {
      rawset.add(msg.raw) 
    }
    const newarray = []
    for await (const msg of rawset) {
      const opened = await bogbot.open(msg)
      const blob = await bogbot.find(opened.data)
      if (blob) {
        opened.txt = blob
      }
      newarray.push(opened)
    }
    
    newarray.sort((a,b) => a.timestamp - b.timestamp)
    console.log(newarray)
    arraystore = newarray
    save()
    newData = false
  } 
}, 1000)

console.log(arraystore)

bogbot.query = async (query) => {
  if (arraystore[0] && !query) { return arraystore }
  if (arraystore[0] && query.startsWith('?')) {
    const search = query.substring(1).replace(/%20/g, ' ').toUpperCase()
    const result = arraystore.filter(msg => msg.txt && msg.txt.toUpperCase().includes(search))
    return result  
  } else if (arraystore[0]) {
    const result = arraystore.filter(msg => msg.author == query || msg.hash == query)
    return result
  }
}

bogbot.getLatest = async (query) => {
  if (arraystore[0]) {
    const querylog = arraystore.filter(msg => msg.author == query)
    if (querylog[0]) {
      return querylog[querylog.length - 1]
    }
  }
}

bogbot.getFeeds = async () => {
  const feeds = []

  arraystore.map(msg => {
    if (!feeds.includes(msg.author)) {
      feeds.push(msg.author)
    }
  })

  return feeds
}

function save () {
  const stringedarray = JSON.stringify(arraystore)
  cachekv.put('arraystore', stringedarray)
}

bogbot.add = async (msg) => {
  const opened = await bogbot.open(msg)
  const dupe = arraystore.filter(message => message.hash === opened.hash)
  if (opened && !dupe[0]) {
    const found = await bogbot.find(opened.data)
    if (found) {
      opened.txt = found
    }
    arraystore.push(opened)
    newData = true
  }
}

bogbot.make = async (file) => {
  const hash = encode(
    Array.from(
      new Uint8Array(
        await crypto.subtle.digest("SHA-256", new TextEncoder().encode(file))
      )
    )
  )
  await cachekv.put(hash, file)
  return hash
}

bogbot.find = async (hash) => {
  const file = await cachekv.get(hash)
  if (file) {
    return file
  } 
}


const info = new Map()

bogbot.getInfo = async (id) => {
  if (info.has(id)) {
    return info.get(id)
  } else if (await cachekv.get(id)) {
    const gotInfo = JSON.parse(await cachekv.get(id))
    info.set(id, gotInfo)
    return gotInfo
  } else {
    const gotInfo = {}
    return gotInfo
  }
}

bogbot.saveInfo = async (pubkey, data) => {
  info.set(pubkey, data)
  await cachekv.put(pubkey, JSON.stringify(data))
}

