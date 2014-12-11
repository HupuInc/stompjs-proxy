Stomp websocket proxy, for Stomp.js
===================================

Installation
------------

    npm install stompjs-proxy

Usage
-----

```javascript
var stompProxy = require('stompjs-proxy');

stompProxy({
  cluster: {
    size: 4,
    repl: false,
  },
  listen: {
    host: '127.0.0.1',
    port: 3000,
    path: '/stomp',
  },
  upstream: {
    host: '127.0.0.1',
    port: 61613,
  },
  auth: {
    'id': 'key',
  },
});
```
