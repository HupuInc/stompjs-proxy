var Stomp = require('stompjs');

(function doemit() {
  var client = Stomp.overTCP('127.0.0.1', 61613, {
    onerror: onend,
    onclose: onend,
  });

  client.debug = console.log.bind(console);

  client.connect({}, function onopen() {
    (function snd() {
      if (client) {
        client.send('/topic/foo', {}, 'Hello, Stomp!');
        setTimeout(snd, 1000);
      }
    })();
  });

  function onend(e) {
    if (e) console.log(e);
    if (client) {
      client = null;
      setTimeout(doemit, 1000);
    }
  }

})();
