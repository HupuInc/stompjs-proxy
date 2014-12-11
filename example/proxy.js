var stompProxy = require('../');

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
