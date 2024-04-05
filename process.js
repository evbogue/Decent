import { h } from './lib/h.js'
import { bogbot } from './bogbot.js'
import { render } from './render.js'
import { markdown } from './markdown.js'
import { trystero } from './trystero.js'

export const process = async (msg, id) => {
  const scroller = document.getElementById('scroller')
  console.log(msg)
  if (msg.length === 44 && !msg.startsWith('{')) {
    const blob = await bogbot.find(msg)

    if (blob) {
      const obj = {type: 'blob', payload: blob}
      trystero.send(obj)
    }

    const message = await bogbot.query(msg)

    if (message[0]) {
      const obj = {
        type: 'post',
        payload: message[0].raw,
        blob: await bogbot.find(message[0].data)
      }
      trystero.send(obj)
    }
  }

  if (msg.type === 'blob') {
    const hash = await bogbot.make(msg.payload)
    const blobDiv = document.getElementById(hash)
    if (blobDiv) {
      console.log(blobDiv)
      blobDiv.innerHTML = await markdown(msg.payload)
    }
  }
  if ((msg.type === 'post' || msg.type === 'latest') && msg.payload) {
    const opened = await bogbot.open(msg.payload)
    
    if (msg.type === 'latest') {
      if (msg.blob) {
        await bogbot.make(msg.blob)
      }
      const latest = await bogbot.getInfo(opened.author)

      if (msg.image || msg.name) {
        if (msg.name) {
          if (latest.name != msg.name) {
            console.log('NAME IS NEW')
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
                if (latest.image.length > 44) {
                  image.src = latest.image
                } 
                if (latest.image.length == 44) {
                  const blob = await bogbot.find(latest.image)
                  image.src = blob 
                }
              }
            }, 100)
          }
        }
      }
      
      await bogbot.saveInfo(opened.author, msg)
    }

    await bogbot.add(opened.raw)
    if (msg.blob) {
      await bogbot.make(msg.blob)
    }
    if (msg.boxed) {
      opened.text =  '🔒 '
      opened.text = opened.text + (await unbox(msg.boxed) || '')
    } else {
      opened.text = msg.blob
    }

    const rendered = await render(opened)

    const alreadyRendered = document.getElementById(opened.hash)

    const src = window.location.hash.substring(1)

    const shouldWeRender = (src === opened.author || src === opened.hash || src === '')

    if (shouldWeRender && !alreadyRendered) {
      scroller.appendChild(rendered)
      setTimeout(() => {
        window.scrollTo(0, document.body.scrollHeight)
      }, 50)
    }

    const previous = await bogbot.query(opened.previous)

    if (previous && !previous[0]) { trystero.send(opened.previous)}
  }
}
