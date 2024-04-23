import nacl from './lib/nacl-fast-es.js'
import { decode, encode } from './lib/base64.js'
import { serveDir } from 'https://deno.land/std/http/file_server.ts'

const bogbot = {}

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
    obj.text = blob
  }

  return obj
}


const sockets = new Set()

const kv = await Deno.openKv()

const process = async (m) => {
  console.log(m.data)
  try {
    const msg = JSON.parse(m.data)
    const opened = await bogbot.open(msg.payload)
    if (msg.type === 'latest') {
      const latest = await kv.get([opened.author])
      if (latest.value.payload != msg.payload) {
        const body = 'New post from ' + (msg.name || opened.author.substring(0, 5)) +' https://bogbook.com/#' + opened.author
        await fetch('https://ntfy.sh/bogbook', {
          method: 'POST',
          body
        })
        await kv.set([opened.author], msg)
        await kv.set([opened.hash], opened.raw)
      }
    }
    if (msg.text) {
      const blobhash = await bogbot.make(msg.text)
      await kv.set([blobhash], msg.text)
    }
  } catch (err) {}
  if (m.data.length === 44) {
    try {
      const msg = await kv.get([m.data])
      if (typeof msg.value === 'object') {
        if (msg.value) {
          const string = JSON.stringify(msg.value)
          m.target.send(string)
        }
      } else {
        m.target.send(msg.value)
      }
    } catch (err) {}
  }
}

Deno.serve((r) => {
  try {
    const { socket, response } = Deno.upgradeWebSocket(r)
    sockets.add(socket)
    socket.onmessage = process
    socket.onclose = _ => sockets.delete(socket)
    return response
  } catch {
    return serveDir(r, {quiet: 'True'})
  }
})
