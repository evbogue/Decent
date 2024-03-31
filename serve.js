import { serveDir } from 'https://deno.land/std/http/file_server.ts'

Deno.serve((r) => {
  return serveDir(r, {quiet: 'True'})
})
