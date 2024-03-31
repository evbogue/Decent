import {h} from './lib/h.js'
import {bogbot} from './bogbot.js'
import { render } from './render.js'
import { trystero } from './trystero.js'

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
        console.log(pubkey)
        const latest = await bogbot.getInfo(pubkey)
        console.log(latest)
        latest.type = 'latest'
        latest.payload = opened.raw
        trystero.send(latest)
        bogbot.add(opened.raw)
        bogbot.saveInfo(pubkey, latest)
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

