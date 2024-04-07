import {h} from './lib/h.js'
import {bogbot} from './bogbot.js'
import { render } from './render.js'
import { sendLatest } from './connect.js'
import {vb} from './lib/vb.js'
import { decode } from './lib/base64.js'
import { markdown } from './markdown.js'

const pubkey = await bogbot.pubkey()

export const prompter = async (hash) => {
  let context = ''
  if (hash) { 
    let msg = await bogbot.query(hash)

    
    if (msg[0]) {
      msg = msg[0]
      const getReplyPrevious = await bogbot.getInfo(msg.author)

      context = '[' + (getReplyPrevious.name || msg.author.substring(0, 7)) + '](' + msg.author + ') ↳ [' + (msg.hash.substring(0, 7)) + '](' + msg.hash + ') '
    }
  }
  const input = h('input', {
    id: 'prompter',
    placeholder: 'Message',
    oninput: async (e) => {
      const img = vb(decode(pubkey), 256)
      const link = h('a', {href: '#' + pubkey, classList: 'name' + pubkey}, [pubkey.substring(0, 10)])
    
      img.classList = 'avatar image' + pubkey
    
      const latest = await bogbot.getInfo(pubkey)
    
      if (latest.name) {
        link.textContent = latest.name
      }
    
      if (latest.image) {
        if (latest.image.length > 44) {
    
          img.src = latest.image
        } if (latest.image.length === 44) {
          const blob = await bogbot.find(latest.image)
          img.src = blob
        }
      }
      const ts = h('a', {href: '#', classList: 'timestamp'}, ['Preview'])

      const content = h('div')

      content.innerHTML = await markdown(context + ' ' + input.value)

      const preview = h('div', {id: 'preview'}, [
        h('div', {classList: 'message'}, [
          h('a', {href: '#' + pubkey}, [img]),
          link,
          ' ',
          ts,
          content
        ])
      ])
      const get = document.getElementById('preview')
      if (get) {get.remove()}
      if (hash) {
        preview.classList = 'reply'
        const parentMsg = document.getElementById(hash)
        if (parentMsg) {
          parentMsg.appendChild(preview)
        }
      } else {
        const scroller = document.getElementById('scroller')
        scroller.appendChild(preview)

      }
      window.scrollTo(0, document.body.scrollHeight)
    },
    onkeyup: async (e) => {
      if (e.key == 'Enter' && input.value) {
        const get = document.getElementById('preview')
        get.remove()
        const published = await bogbot.publish(context + ' ' +input.value)
        input.value = ''
        const opened = await bogbot.open(published)
        const rendered = await render(opened)
        if (hash) {
          console.log('FIND HASH')
          const parentMsg = document.getElementById(hash)
          parentMsg.appendChild(h('div', {classList: 'reply'}, [rendered]))
        } else {
          scroller.appendChild(rendered)
        }
        const latest = await bogbot.getInfo(pubkey)
        latest.type = 'latest'
        latest.payload = opened.raw
        bogbot.add(opened.raw)
        await bogbot.saveInfo(pubkey, latest)
        await sendLatest()
        window.scrollTo(0, document.body.scrollHeight)
      }
    }
  })


  const div = h('div', {id: 'prompt'}, [input])

  return div
}

window.onload = () => {
  const input = document.getElementById('prompter').focus()
}

