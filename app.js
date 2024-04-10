import {h} from './lib/h.js'
import {bogbot} from './bogbot.js' 
import {prompter} from './prompter.js'
import {avatar} from './render.js'
import {settings} from './settings.js'
import {connect, gossip} from './connect.js'
import {adder} from './adder.js'

if (!window.location.hash) { window.location = '#' }

const server = (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host

connect(server)

const screen = h('div', {id: 'screen'})

const online = h('div', {id: 'online'})

screen.appendChild(online)

const navbar = h('div', {id: 'navbar'}, [
  await avatar(await bogbot.pubkey()),
  h('button', {onclick: () => {
    window.location.hash = '#'
    window.scrollTo(0, document.body.scrollHeight)
  }}, ['Home']),
  h('button', {
    onclick: () => {
      window.location.hash = '#settings'
    }
  }, ['Settings'])
])

screen.appendChild(navbar)

document.body.appendChild(screen)

const route = async () => {
  const src = window.location.hash.substring(1)
  if (src.length === 43) {
    window.location.hash = src + '='
  }
  const scroller = h('div', {id: 'scroller'})

  scroller.appendChild(await prompter(src))
  screen.appendChild(scroller)

  if (src === 'settings') { 
    scroller.appendChild(settings)    
  } else {
    const log = await bogbot.query(src)

    if (log && log[0]) {
      adder(log, src, scroller)
    } else if (src.length === 44) {
      gossip(src)
    }

    setTimeout(() => {
      window.scrollTo(0, document.body.scrollHeight)
    }, 500)
  }
}

window.onhashchange = () => {
  const scroller = document.getElementById('scroller')
  scroller.remove()
  route() 
}

route() 
