import {h} from './lib/h.js'
import {human} from './lib/human.js'
import {bogbot} from './bogbot.js'
import {vb} from './lib/vb.js'
import { decode } from './lib/base64.js'
import { markdown } from './markdown.js'
import { gossip } from './connect.js'

export const avatar = async (id) => {
  const img = vb(decode(id), 256)

  img.classList = 'avatar image' + id

  const link = h('a', {href: '#' + id, classList: 'name' + id}, [id.substring(0, 7) + '...'])

  const latest = await bogbot.getInfo(id)

  if (latest.name) {
    link.textContent = latest.name
  }

  if (latest.image) {
    if (latest.image.length > 44) {

      img.src = latest.image
    } if (latest.image.length === 44) {
      const blob = await bogbot.find(latest.image)
      if (blob) {
        img.src = blob
      }
      if (!blob) {
        gossip(latest.image)
        setTimeout(async () => { 
          const newblob = await bogbot.find(latest.image)
          img.src = newblob
        }, 500)
      }
    }
  }

  const span = h('span', [
    img,
    ' ',
    link,
  ])


  return span
}

export const render = async (msg) => {
  const wrapperDiv = h('span', {id: msg.hash})

  const content = h('span', ['...'])

  if (msg.txt) {
    content.innerHTML = await markdown(msg.txt)
  } if (!msg.txt) {
    const blob = await bogbot.find(msg.data)
    if (blob) {
      content.innerHTML = await markdown(blob)
    } else {
      gossip(msg.data)
      setTimeout(async () => {
        const newblob = await bogbot.find(msg.data)
        if (newblob) {
          content.innerHTML = await markdown(newblob)
        }
      }, 500)
    }
  }

  const ts = h('a', {href: '#' + msg.hash, classList: 'timestamp'}, [human(new Date(msg.timestamp))])

  setInterval(() => {
    ts.textContent = human(new Date(msg.timestamp))
  }, 5000)

  const div = h('div', {classList: 'message'}, [
    await avatar(msg.author),
    ' ',
    ts,
    ' ',
    content
  ])

  wrapperDiv.appendChild(div)

  const threads = await bogbot.query('?' + msg.hash)

  if (threads && threads[0]) {
    const replyDiv = h('div', {classList: 'reply'})
    wrapperDiv.appendChild(replyDiv)
    threads.forEach(async (item) => {
      const getMsg = document.getElementById(item.hash)
      if (!getMsg) {
        const rendered = await render(item)
        replyDiv.appendChild(rendered)
      }
    })
  }

  if (msg.previous != msg.hash) {
    const prev = await bogbot.query(msg.previous)
    if (prev && !prev[0]) {
      console.log('ASK FOR PREVIOUS')
      gossip(msg.previous)
    }
  }

  return wrapperDiv
}
