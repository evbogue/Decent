import { process } from './process.js'
import { bogbot } from './bogbot.js'
import { trystero } from './trystero.js'
import { h } from './lib/h.js'

const pubkey = await bogbot.pubkey()

export const connect = (s) => {
  trystero.connect({appId: 'bogbookv4public', password: 'password'})

  trystero.onmessage(async (data, id) => {
    await process(data, id)
  })

  trystero.join(async (id) => {
    const latest = await bogbot.getInfo(pubkey)
    trystero.send(latest)
    console.log('joined ' + id)
    const feeds = await bogbot.getFeeds()
    feeds.forEach(feed => {
      if (feed != pubkey) {
        trystero.send(feed)
      }
    })
  })

  trystero.leave(id => {
    console.log('left ' + id)
  })
}
