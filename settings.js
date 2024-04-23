import { h } from './lib/h.js'
import { cachekv } from './lib/cachekv.js'
import { bogbot } from './bogbot.js'
import { decode } from './lib/base64.js'
import { vb } from './lib/vb.js'
import { gossip } from './gossip.js'

const keypair = await bogbot.keypair()
const pubkey = await bogbot.pubkey()
let latest = await bogbot.getInfo(pubkey)

const input = h('input', {placeholder: latest.name || pubkey})

const saveName = h('button', {
  onclick: async () => {
    if (input.value) {
      latest = await bogbot.getInfo(pubkey)
      latest.name = input.value
      input.placeholder = input.value
      await bogbot.saveInfo(pubkey, latest)
      gossip(latest)
      const namesOnScreen = document.getElementsByClassName('name' + pubkey)
      for (const names of namesOnScreen) {
        names.textContent = input.value
      }
      input.value = ''
    }
  }
}, ['Save name'])

const uploadButton = h('button', {
  onclick: () => {
    uploader.click()
  }
}, ['Upload profile photo'])

const uploader = h('input', {
  type: 'file', style: 'display: none;', onchange: (e) => {
    const file = e.srcElement.files[0]
    const reader = new FileReader()
    reader.onloadend = async () => {
      latest = await bogbot.getInfo(pubkey) 
      img.src = await reader.result
      const imagesOnScreen = document.getElementsByClassName('image' + pubkey)
      for (const image of imagesOnScreen) {
        image.src = img.src
      }
      const blob = await bogbot.make(img.src)
      latest.image = blob
      gossip(img.src)
      gossip(latest)
      await bogbot.saveInfo(pubkey, latest)
    }
    reader.readAsDataURL(file)
}})

const img = vb(decode(pubkey), 256)

img.classList = 'avatarbig image' + pubkey

if (latest.image) {
  const blob = await bogbot.find(latest.image)
  img.src = blob
}

const textarea = h('textarea', [keypair])

const deleteKeypair = h('button', {
  style: 'float: right;',
  onclick: async () => {
    await bogbot.deletekey()
    location.href = '#'
    location.reload()
  }
}, ['Delete Keypair'])

const deleteEverything = h('button', {
  style: 'float: right;',
  onclick: async () => {
    await cachekv.clear()
    await bogbot.deletekey() 
    location.href = '#'
    location.reload()
  }
}, ['Delete Everything'])

const saveButton = h('button', {
  onclick: async () => {
    if (textarea.value && textarea.value.length === keypair.length) {
      await localStorage.setItem('keypair', textarea.value)
    } else {
      alert('Invalid Keypair')
    }
    location.href = '#'
    location.reload()
  }
}, ['Save keypair'])

export const settings = h('div', {classList: 'message'}, [
  img,
  h('br'),
  uploadButton,
  h('br'),
  h('hr'),
  'Name: ',
  input,
  saveName,
  h('br'),
  h('hr'),
  'Keypair:',
  h('br'),
  textarea,
  h('br'),
  deleteKeypair,
  deleteEverything,
  saveButton
])
