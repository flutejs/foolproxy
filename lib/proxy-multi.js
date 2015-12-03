var co = require('co')
var url = require('url')
var net = require('net')
var processExit = require('exit')
var serverDestroy = require('server-destroy')

var KoaHttpServer = require('./util/koa-http-server')
var proxyRequest = require('./util/proxy-request')
var request = require('./util/request')
var cors = require('./util/cors')
var forEach = require('./util/forEach')
var mime = require('./util/mime')
var exec = require('./util/exec')

var myFs = require('./util/fs')

var port = global.foolproxy_port;

function proxyMulti(localMappingFile) {

  var proxyArray = []
  var proxyEnabled = true

  var httpServer,
      gens = [];

  co(function*() {

    //+++++++++++++++++++++++++++++++++
    //0. read file
    //+++++++++++++++++++++++++++++++++
    var mappingList = JSON.parse(yield myFs.readFile(localMappingFile))

    var isRemote2Remote = function(url){
      return /http(s)?:\/\//.test(url)
    }

    //set gen
    for (var item in mappingList) {

      (function(item) {

        gens.push(function*(next) {

          console.log(url.parse(this.url).path, url.parse(item).path)
          if (url.parse(this.url).path == url.parse(item).path) {
            if (isRemote2Remote(mappingList[item])) {
              this.body = (yield request(mappingList[item]))[1]
            } else {
              this.body = yield myFs.readFile(mappingList[item])
            }
            console.log(this.body)
          } else {
            yield next
          }
        })

      })(item);

    }

    //+++++++++++++++++++++++++++++++++
    //1. setting network
    //+++++++++++++++++++++++++++++++++
    var services = (yield exec('networksetup -listallnetworkservices'))[0]

    yield forEach(services.split('\n'), function*(service, index) {
      try {
        var info = String(yield exec('networksetup -getinfo "' + service + '"'))
        if (/IP address:\s*\d+/.test(info)) {
          proxyArray.push(service)
        }
      } catch (err) {
      }
    })

    yield forEach(proxyArray, function*(service, index) {
      try {
        yield exec('networksetup -setwebproxy "' + service + '" 127.0.0.1 ' + port)
      } catch (err) {
        proxyEnabled = false
      }
    })

    if (!proxyEnabled || proxyArray.length == 0) {
      console.log('\nFail to setting proxy server'.red)
      return
    }

    console.log('Success to setting proxy server'.green)

    //+++++++++++++++++++++++++++++++++
    //2. create a proxy server
    //+++++++++++++++++++++++++++++++++
    httpServer = KoaHttpServer(port)

    httpServer.use(cors)
    gens.forEach(function(gen) {
      httpServer.use(gen)
    });
    httpServer.use(proxyRequest())

    console.log("listening on port " + port)

  }).catch(function (err) {
    console.log(err.stack)
  });

  // close the proxy
  function exitHandler() {
    var array = []
    proxyArray.forEach(function (service) {
      array.push('networksetup -setwebproxystate "' + service + '" off')
      array.push('networksetup -setsecurewebproxystate "' + service + '" off')
    })
    require('child_process').exec(array.join('\n'))

    serverDestroy(httpServer && httpServer.server)

    processExit()
  }

  process.on('exit', exitHandler)
  process.on('SIGINT', exitHandler)
  process.on('uncaughtException', exitHandler)

}

module.exports = proxyMulti