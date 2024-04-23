import { h } from './lib/h.js'
import { bogbot } from './bogbot.js'
import { render } from './render.js'
import { markdown } from './markdown.js' 
import { gossip } from './gossip.js'

const doWeHave = async (msg, opened) => {
  const query = await bogbot.query(opened.hash)
  if (query && query[0]) {
    console.log('WE HAVE THIS ALREADY')
  } else {
    bogbot.add(opened.raw)
    shouldWeRender(msg, opened)
  }
}

const shouldWeRender = async (msg, opened) => {
  const src = window.location.hash.substring(1)
  if (src == '' || src == opened.hash || src == opened.author) {
    console.log('RENDER IT')
    const rendered = await render(opened)
    const scroller = document.getElementById('scroller')
    if (src == '' && msg.type === 'latest') {
      scroller.firstChild.after(rendered)
    } else if (scroller.firstChild && msg.type === 'latest') {
      scroller.firstChild.before(rendered)
    } else { scroller.appendChild(rendered)}
  }
}

const updateAvatar = async (msg, opened) => {
  const latest = await bogbot.getInfo(opened.author)

  if (msg.image || msg.name) {
    if (msg.name) {
      if (latest.name != msg.name) {

        latest.name = msg.name
        setTimeout(() => {
          const namesOnScreen = document.getElementsByClassName('name' + opened.author)
          for (const names of namesOnScreen) {
            names.textContent = latest.name
          }
        }, 100)

      }
    }
    if (msg.image) {
      if (latest.image != msg.image) {
        latest.image = msg.image
        setTimeout(async () => {
          const imagesOnScreen = document.getElementsByClassName('image' + opened.author)
          for (const image of imagesOnScreen) {
            if (latest.image.length == 44) {
              const blob = await find(latest.image)
              if (blob) {
                image.src = blob
              } else { gossip(msg.image)}
            }
          }
        }, 100)
      }
    }
  }

  await bogbot.saveInfo(opened.author, msg)

}

export const process = async (data, id) => {
  console.log(data)
  try {
    const opened = await bogbot.open(data.payload)
    if (data.image || data.name) { await updateAvatar(data, opened)}
    if (data && data.text) {
      const blobhash = await bogbot.make(data.text)
    }
    await doWeHave(opened)
  } catch (err) {
  }
  try {
    const msg = JSON.parse(data)
    const opened = await bogbot.open(msg.payload)
    if (msg.image || msg.name) { await updateAvatar(msg, opened)}
    if (msg && msg.text) {
      const blobhash = await bogbot.make(msg.text)
    }
    await doWeHave(data, opened)
  } catch (err) {
  }
  try {
    const opened = await bogbot.open(data)
    await doWeHave(data, opened) 
  } catch (err) {
    const hash = await bogbot.make(data)
    const got = document.getElementById(hash)
    if (got) {
      got.innerHTML = await markdown(data)
    }
  }
}
