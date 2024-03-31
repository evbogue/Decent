import { joinRoom } from './lib/trystero-torrent.min.js'

export const trystero = {}

trystero.connect = (config) => {
  const room = joinRoom(config, 'trystero')
 
  trystero.room = room 
 
  const [ send, onmessage ] = room.makeAction('message')

  trystero.send = send

  trystero.onmessage = onmessage

  trystero.onstream = room.onPeerStream

  trystero.addstream = room.addStream

  trystero.join = room.onPeerJoin

  trystero.leave = room.onPeerLeave
}
