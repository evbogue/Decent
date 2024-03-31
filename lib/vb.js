// Visualize Buffer by Dominic Tarr https://github.com/dominictarr/visualize-buffer

export function vb (b, width) {
  width = width || 256
  var canvas = document.createElement('canvas')

  canvas.height = width
  canvas.width = width

  var ctx = canvas.getContext('2d')

  var blocks = Math.ceil(Math.sqrt(b.length*2))

  var B = Math.ceil(width/blocks)
  function rect(i, color) {
    var x = i % blocks
    var y = ~~(i / blocks)
    if(color < 12)
      ctx.fillStyle =
        'hsl('+(color/12)*360 + ',100%,50%)'
    else {
      ctx.fillStyle =
        'hsl(0,0%,'+~~(((color-12)/3)*100)+'%'
    }
    ctx.fillRect(x*B, y*B, B, B)
  }

  for(var i = 0; i < b.length; i++) {
    rect(2*i,     b[i] >> 4 & 15)
    rect(2*i + 1, b[i]      & 15)
  }

  var img = document.createElement('img')
  img.src = canvas.toDataURL()
  return img
}
