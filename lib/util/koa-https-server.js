var https = require('https')
var koa = require('koa')

module.exports = function (key, cert, port) {

  var app = koa()
  var middleware = []

  app.use(function*() {

    var next
    var len = middleware.length

    while (len--) {
      var gen = middleware[len]
      try {
        next = gen.call(this, next)
      }
      catch (err) {
      }
    }

    yield next

  })

  app.on('error', function (err) {
    console.log(err)
  })

  var server = https.createServer({
    key: key,
    cert: cert
  }, app.callback()).listen(port)

  function use(gen) {
    middleware.push(gen)
  }

  function unshift(gen) {
    middleware.unshift(gen)
  }

  var koaHttpsServer = {
    middleware: middleware,
    use: use,
    app: app,
    unshift: unshift,
    server: server
  }

  return koaHttpsServer

}