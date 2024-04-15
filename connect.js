import { process } from './process.js'
import { bogbot } from './bogbot.js'
import { joinRoom, selfId } from './lib/trystero-torrent.min.js'
import { h } from './lib/h.js'

const pubkey = await bogbot.pubkey()

//const bogRoom = joinRoom({appId: 'bogbooktestnet', password: 'password'}, 'trystero')
const bogRoom = joinRoom({appId: 'bogbookv4public', password: 'password'}, 'trystero')

const [ sendBog, onBog ] = bogRoom.makeAction('message')

onBog((data, id) => {
  process(data, id)
})

export const directSend = (obj, id) => {
  sendBog(obj, id)
}

export const sendLatest = async () => {
  const latest = await bogbot.getInfo(pubkey)
  if (latest.image) {
    const blob = await bogbot.find(latest.image)
    sendBog(blob)
  }
  sendBog(latest)
}

export const connect = (server) => {
  bogRoom.onPeerJoin(async (id) => {
    const online = document.getElementById('online')
    const alreadyConnected = document.getElementById(id)
    if (!alreadyConnected) {
      online.appendChild(h('div', {id}))
    }
    await sendLatest(id)
    console.log('joined ' + id)
  })

  bogRoom.onPeerLeave(id => {
    const got = document.getElementById(id)
    if (got) { got.remove()}
    console.log('left ' + id)
  })
}

export let queue = []

const loadFeedsIntoQueue = async () => {
  const feeds = await bogbot.getFeeds()
  queue = queue.concat(feeds)
}

loadFeedsIntoQueue()

setInterval(async () => {
  if (queue.length) {
    const peers = await bogRoom.getPeers()
    const keys = Object.keys(peers)

    const peer = keys[Math.floor((Math.random() * keys.length))]
    const hash = queue[Math.floor((Math.random() * queue.length))]
    //console.log(queue)
    sendBog(hash, peer)
  }
}, 500)

// ask random peers for messages one at a time, removing msg from queue over in process.js if we get it
export const gossip = async (msg) => {
  if (msg.length === 44) {
    queue.push(msg)
  } else {
    console.log('ONLY SEND HASHES AND PUBKEYS TO GOSSIP PLEASE')
    console.log(msg)
  }
}

// sends to all peers
export const blast = async (msg) => {
  if (msg.length === 44) {
    const msg = await bogbot.query(msg)
    if (msg && msg[0]) {
      sendBog(msg[0])
    } 
  } else {
    console.log('ONLY SEND HASHES AND PUBKEYS TO BLAST PLEASE')
  }
}

