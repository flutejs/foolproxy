
var proxy = require('./proxy')

function init(remoteUrl, localUrl) {
  proxy(remoteUrl, localUrl)
}

module.exports = init