var freeport = require('freeport')

module.exports = port

function port(time) {
  return function(cb){
    freeport(cb)
  }
}
