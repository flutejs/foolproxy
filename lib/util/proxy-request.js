var request = require('request')

module.exports = proxyRequest

function proxyRequest(target) {

  var r = request

  if (target) {
    r = request.defaults({
      proxy: target
    })
  }

  return function*() {

    this.body = this.req.pipe(
        r(this.req.url).on('error', function (err) {
          console.log(err)
        })
    )

  }
}