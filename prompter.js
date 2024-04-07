import {h} from './lib/h.js'
import {bogbot} from './bogbot.js'
import { render } from './render.js'
import { sendLatest } from './connect.js'

const pubkey = await bogbot.pubkey()

export const prompter = async (msg) => {
  const input = h('input', {
    id: 'prompter',
    placeholder: 'Message',
    onkeyup: async (e) => {
      if (e.key == 'Enter') {
        const published = await bogbot.publish(input.value)
        input.value = ''
        const opened = await bogbot.open(published)
        const rendered = await render(opened)
        scroller.appendChild(rendered)
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

