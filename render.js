import {h} from './lib/h.js'
import {human} from './lib/human.js'
import {bogbot} from './bogbot.js'
import {vb} from './lib/vb.js'
import { decode } from './lib/base64.js'
import { markdown } from './markdown.js'
import { trystero } from './trystero.js'

export const render = async (msg) => {
  const wrapperDiv = h('div', {id: msg.hash})
  const link = h('a', {href: '#' + msg.author, classList: 'name' + msg.author}, [msg.author.substring(0, 10)])
  const img = vb(decode(msg.author), 256)

  img.classList = 'avatar image' + msg.author

  const latest = await bogbot.getInfo(msg.author)

  if (latest.name) {
    link.textContent = latest.name
  }

  if (latest.image) {
    img.src = latest.image
  }

  const content = h('div', {id: msg.data})
  if (msg.txt) {
    content.innerHTML = await markdown(msg.txt)
  } if (!msg.txt) {
    const blob = await bogbot.find(msg.data)
    if (blob) {
      content.innerHTML = await markdown(blob)
    } else {
      content.textContent = '[NO BLOB]'
      trystero.send(msg.data)
    }
  }

  const div = h('div', {classList: 'message'}, [
    img,
    link,
    ' ',
    h('a', {href: '#' + msg.hash, classList: 'timestamp'}, [human(new Date(msg.timestamp))]),
    content
  ])

  wrapperDiv.appendChild(div)

  const threads = await bogbot.query('?' + msg.hash)

  console.log(threads)

  if (threads[0]) {
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


  return wrapperDiv
}
