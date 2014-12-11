var Stomp = require('stompjs');

// override
Stomp.overWS = require('stompjs-http-signature').overWS;

(function process() {
  var client = Stomp.overWS('ws://127.0.0.1:3000/stomp', {
    onerror: onend,
    onclose: onend,
    sign: {
      algorithm: 'hmac-sha256',
      keyId: 'id',
      key: 'key',
    },
  });

  var timer = setTimeout(function () {
    client.disconnect();
    onend();
  }, 5*1000);

  client.debug = console.log.bind(console);

  client.connect({}, function onopen() {
    clearTimeout(timer);

    client.subscribe('/topic/foo', function (msg) {
      console.log(msg.body);
      msg.ack();
    }, {id: 'id-foo', persistent: true, ack: 'client'});
  });

  function onend(e) {
    if (e) console.log(e);
    if (client) {
      client = null;
      setTimeout(process, 1000);
    }
  }

})();
