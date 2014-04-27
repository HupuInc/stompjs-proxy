Stomp over websocket proxy, for Stomp.js
========================================

Usage:

```javascript
var StompProxy = require('stompjs-proxy');

StompProxy({
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
