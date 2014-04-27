/*
 Copyright 2014 Hupu Inc., by Wang Wenlin <wangwenlin@hupu.com>
 BSD License.
 */

// TODO: Add debug and log supports

var net = require('net');
var ws = require('ws');
var httpSignature = require('http-signature');

module.exports = function StompProxy(opts) {
  if (!opts || !opts.listen || !opts.upstream) {
    throw Error('Invalid options');
  }

  var fe = opts.listen;
  var up = opts.upstream;

  if (opts.auth) {
    fe.verifyClient = function (info) {
      try {
        var parsed = httpSignature.parse(info.req);
        var key = opts.auth[parsed.keyId];
        return httpSignature.verify(parsed, key);
      } catch (e) {
        return false;
      }
    };
  }

  ws.createServer(fe, function (c) {
    var u = upstream(up);
    pipe(c, u);
  });
};

/* Internals
 */
var LFLF = '\x0a\x0a';
var FILTER = /^\/(topic|queue)\/.+/;

var Char = {
  NUL: '\x00',
  CR : '\x0d',
  LF : '\x0a',
};

var Byte = {
  NUL: 0x00,
  CR : 0x0d,
  LF : 0x0a,
};

function upstream(opt) {
  var buffer;
  var socket = net.connect(opt);

  socket.on('data', function (income) {
    /* Concat buffer */
    if (!buffer || !buffer.length) {
      buffer = income;
    } else {
      buffer = Buffer.concat([buffer, income]);
    }

    var frames = [];
    var len = buffer.length;
    var i = len - income.length;

    for (; i < len; ) {
      if (!i) eatlf();
      frame();
    }

    if (frames.length) {
      socket.emit('frames', frames);
    }

    function eatlf() {
      for (; i < len && buffer[i] === Byte.LF; i++) frames.push(Char.LF);
      if (i > 0) fwd();
    }

    function frame() {
      for (; i < len && buffer[i] !== Byte.NUL; i++) /*skip*/;
      if (i < len) {
        frames.push(buffer.toString('utf8', 0, ++i));
        fwd();
      }
    }

    function fwd() {
      buffer = buffer.slice(i);
      len = buffer.length;
      i = 0;
    }
  });

  return socket;
}

function filter(data) {
  return data.split(Char.NUL)
             .filter(filt)
             .join(Char.NUL);

  function filt(text) {
    try {
      var text = text.trimLeft();
      if (!text) return true;
      var frame = parse(text);
      if (frame.command !== 'SUBSCRIBE') {
        return !!frame.command && frame.command !== 'SEND';
      } else {
        return FILTER.test(frame.headers['destination']);
      }
    } catch (e) {}
  }

  function parse(text) {
    var frame = {
      command: '',
      headers: {},
    };

    var i = text.indexOf(LFLF);
    var hdrs = i > 0 ? text.slice(0, i) : '';

    hdrs.split(Char.LF)
        .forEach(function (line, n) {
      if (n === 0) {
        frame.command = line.toUpperCase().trim();
      } else {
        var pair = line.split(':');
        var k = pair[0].toLowerCase().trim();
        var v = pair[1].trim();

        if (k) {
          if (frame.headers.hasOwnProperty(k)) {
            frame.headers[k] = [].concat(frame.headers[k], v);
          } else {
            frame.headers[k] = v;
          }
        }
      }
    });

    return frame;
  }
}

function pipe(c, u) {
  c.on('message', function (data, flags) {
    if (flags.binary) return;

    var filt = filter(data);
    if (!filt) return;

    if (u.writable && !u.write(filt)) {
      try {
        c.pause();
      } catch (e) {}
    }
  });

  u.on('drain', function () {
    try {
      c.resume();
    } catch (e) {}
  });

  u.on('frames', function (frames) {
    if (c.readyState === ws.OPEN) {
      c.send(frames.join(''));
      if (c.bufferedAmount) {
        u.pause();
        setTimeout(upresume, 1);
      }
    }
  });

  function upresume() {
    if (c.bufferedAmount) {
      setTimeout(upresume, 2);
    } else {
      u.resume();
    }
  }

  c.on('close', upend);
  c.on('error', upend);
  u.on('end', cend);
  u.on('close', cend);
  u.on('error', cend);

  function upend() { u.end(); }
  function cend() { c.close(); }
}
