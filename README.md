# Decent

### A decent-tralized chatroom built using the bog protocol and [trystero](https://github.com/dmotz/trystero/)

Try it at https://decent.deno.dev/

100% compatible and on the same network as [Bogbook](https://bogbook.com/), the biggest difference is that Decent is chat-style, so the composer is at the bottom of the page and you scroll up for old content.

# the bog protocol

Messages are sent around as 

```
<author><signature>
```

Author is an ed25519 pubkey. Signature is an ed25519 signature of... 

```
<timestamp><author><datahash><previous><posthash>
```

Hashes are sha256

Which we turn into a JSON object:

```
  const obj = {
    timestamp: parseInt(opened.substring(0, 13)),
    author: opened.substring(13, 57),
    data: opened.substring(57, 101),
    previous: opened.substring(101, 145),
    hash : opened.substring(145),
    raw: msg
  }
```

Upon launch Decent will attempt to contact other peers via Trystero, and if it finds anyone it'll send your latest post.

---
MIT
