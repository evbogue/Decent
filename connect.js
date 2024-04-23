import { process } from './process.js'
import { bogbot } from './bogbot.js'
import { addSocket, rmSocket} from './gossip.js'
import { trystero } from './trystero.js'
import { h } from './lib/h.js'

const pubkey = await bogbot.pubkey()

export const connect = (s) => {
  trystero.connect({appId: 'bogbookv4public', password: 'password'})

  trystero.onmessage(async (data, id) => {
    await process(data, id)
  })

  trystero.join(async (id) => {
    const online = document.getElementById('online')
    const latest = await bogbot.getInfo(pubkey)
    trystero.send(latest)
    console.log('joined ' + id)
    const contact = h('span', {id})
    online.appendChild(contact)
    const feeds = await bogbot.getFeeds()
    feeds.forEach(feed => {
      if (feed != pubkey) {
        trystero.send(feed)
      }
    })
  })

  trystero.leave(id => {
    const got = document.getElementById(id)
    got.remove()
    console.log('left ' + id)
  })

  const ws = new WebSocket(s)
  //ws.binaryType = 'arraybuffer'

  ws.onopen = async () => {
    const latest = await bogbot.getInfo(pubkey)
    console.log(latest)
    addSocket(ws)
    ws.send(pubkey)
    ws.send(JSON.stringify(latest))
    const feeds = await bogbot.getFeeds()
    feeds.forEach(feed => {
      if (feed != pubkey) {
        ws.send(feed)
      }
    })
  }

  ws.onmessage = async (e) => {
    await process(e.data)
  }

  ws.onclose = (e) => {
    rmSocket(ws)
    setTimeout(function () {
      connect(s)
    }, 1000)
  }

  let retryCount = 1

  ws.onerror = (err) => {
    setTimeout(() => {
      ws.close()
      rmSocket(ws)
      retryCount++
    }, 10000 * retryCount)
  }
}
