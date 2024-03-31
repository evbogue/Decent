const url = 'http://localhost:8000/'

const db = 'v4point1'

export const cachekv = {}

let cache

if ('caches' in window) {
  cache = await caches.open(db)

  cachekv.get = async function (key) {
    const file = await cache.match(url + key)
    try {
      const string = await file.text()
      
      return string
    } catch {
      return undefined
    }
  }
  
  cachekv.put = async function (key, string) {
    await cache.delete(url + key)
    await cache.put(url + key, new Response(string))
  }
  
  cachekv.rm = async function (key) {
    await cache.delete(url + key)
  }

  cachekv.clear = async function () {
    await caches.delete(db)
  }
} else {
  console.log('No Cache API available')
}

