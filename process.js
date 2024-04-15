import { h } from './lib/h.js'
import { bogbot } from './bogbot.js'
import { render, avatar } from './render.js'
import { markdown } from './markdown.js'
import { directSend, queue } from './connect.js'

export const process = async (msg, id) => {
  const scroller = document.getElementById('scroller')
  console.log(msg)
  if (msg.length === 44 && !msg.startsWith('{')) {
    const blob = await bogbot.find(msg)

    if (blob && !blob.startsWith('{')) {
      const obj = {type: 'blob', payload: blob}
      directSend(obj, id)
    }

    const message = await bogbot.query(msg)

    if (message && message[0]) {
      const obj = {
        type: 'post',
        payload: message[0].raw,
        blob: await bogbot.find(message[0].data)
      }
      directSend(obj, id)
    }

    // lets also get the latest and send that around, comparing timestamps to iterate to the latest if the user is not present
  }

  if (msg.type === 'blob') {
    const hash = await bogbot.make(msg.payload)
    queue.forEach(msghash => {
      if (msghash === hash) {
        console.log('REMOVING ' + hash + ' FROM QUEUE')
        queue.pop(msghash)
      }
    })
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
        const hash = await bogbot.make(msg.blob)
        queue.forEach(msghash => {
          if (msghash === hash) {
            console.log('REMOVING ' + hash + ' FROM QUEUE')
            queue.pop(msghash)
          }
        })
      }
      const latest = await bogbot.getInfo(opened.author)
      // HERE WE NEED TO COMPARE IF OUR LATEST IS NEWER THAN THEIR LATEST
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
          const imagesOnScreen = document.getElementsByClassName('image' + opened.author)
          const blerg = await bogbot.find(latest.image)
          for (const image of imagesOnScreen) {
            if (latest.image.length > 44) {
              image.src = latest.image
            } 
            if (latest.image.length == 44) {
              if (blerg) {
                image.src = blerg
              } else {
                setTimeout(async () => {
                  const tryblobagain = await bogbot.find(latest.image)
                  if (tryblobagain) {image.src = tryblobagain}
                }, 500)
              }
            }
          }
        }
      }
      
      await bogbot.saveInfo(opened.author, msg)
      if (id) {
        const onlineId = document.getElementById(id)
        const newOnlineId = h('div', {id}, [await avatar(opened.author)/*, h('div', {style: 'cursor: pointer;',
          onclick: () => {
            startVideo(id) 
          }
        }, ['📺'])*/])
        onlineId.replaceWith(newOnlineId)
      }
    }

    await bogbot.add(opened.raw)
    if (msg.blob) {
      await bogbot.make(msg.blob)
      opened.txt = msg.blob
    }

    queue.forEach(msghash => {
      if (msghash === opened.hash) {
        console.log('REMOVING ' + opened.hash + ' FROM QUEUE')
        queue.pop(msghash)
      }
    })

    const alreadyRendered = document.getElementById(opened.hash)
    const src = window.location.hash.substring(1)
    const shouldWeRender = (src === opened.author || src === opened.hash || src === '')

    if (shouldWeRender && !alreadyRendered && msg.type === 'latest') {
      const rendered = await render(opened)
      scroller.appendChild(rendered)
      setTimeout(() => {
        window.scrollTo(0, document.body.scrollHeight)
      }, 50)
    } else if (shouldWeRender && !alreadyRendered) {
      const rendered = await render(opened)
      scroller.firstChild.before(rendered)
    }
  }
}
