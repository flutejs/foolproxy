var processExit = require('exit');
var fs = require('fs');
var myFs = require('./util/fs');
var path = require('path');
var co = require('co');
var url = require('url');
var http = require('http');
var https = require('https');
var net = require('net');
var serverDestroy = require('server-destroy');

var request = require('./util/request');
var exec = require('./util/exec');
var forEach = require('./util/forEach');
var mime = require('./util/mime');

var KoaHttpServer = require('./util/koa-http-server');
var KoaHttpsServer = require('./util/koa-https-server');
var getPort = require('./util/port');

var proxyRequest = require('./util/proxy-request');
var cors = require('./util/cors');

var port = global.foolproxy_port;

function proxy(remoteUrl, localUrl) {
  var proxyArray = [];
  var proxyEnabled = true;

  //is need mapping remote url?
  var isRemote2Remote = function (url) {
    return /http(s)?:\/\//.test(url)
  };

  var httpServer,
    httpsServers = [];

  var gens = [];

  co(function*() {

    //+++++++++++++++++++++++++++++++++
    // 0. set proxy file
    //+++++++++++++++++++++++++++++++++

    var mappingList = {};
    if (localUrl) {
      mappingList[remoteUrl] = localUrl;
    } else {
      mappingList = JSON.parse(yield myFs.readFile(remoteUrl));
    }

    //set gen
    for (var item in mappingList) {

      (function (item) {

        gens.push(function*(next) {


          if (url.parse(this.url).pathname == url.parse(item).path) {

            this.type = mime[path.extname(this.url)] || 'application/json';

            if (isRemote2Remote(mappingList[item])) {
              this.body = (yield request(mappingList[item]))[1];
            } else {
              this.body = yield myFs.readFile(mappingList[item]);
            }

            console.log(('proxy: ' + this.url + ' success').green);

          } else {
            yield next;
          }
        })

      })(item);

    }

    //+++++++++++++++++++++++++++++++++
    // 1. setting network
    //+++++++++++++++++++++++++++++++++
    var services = (yield exec('networksetup -listallnetworkservices'))[0];

    yield forEach(services.split('\n'), function*(service, index) {
      try {
        var info = String(yield exec('networksetup -getinfo "' + service + '"'));
        if (/IP address:\s*\d+/.test(info)) {
          proxyArray.push(service)
        }
      } catch (err) {
      }
    });

    yield forEach(proxyArray, function*(service, index) {
      try {
        yield exec('networksetup -setwebproxy "' + service + '" 127.0.0.1 ' + port);
        yield exec('networksetup -setsecurewebproxy "' + service + '" 127.0.0.1 ' + port);
      } catch (err) {
        proxyEnabled = false;
      }
    });

    if (!proxyEnabled || proxyArray.length == 0) {
      console.log('\nFail to setting proxy server'.red);
      return;
    }

    console.log('Success to setting proxy server'.green);

    //+++++++++++++++++++++++++++++++++
    // 2. set https
    //+++++++++++++++++++++++++++++++++

    var domains = {};

    function tpl(str, obj) {
      var s = str;
      for (var i in obj) {
        s = s.replace(new RegExp(('\\$' + i), 'g'), obj[i]);
      }
      return s;
    }

    for (var item in mappingList) {
      if (/https:\/\//ig.test(item)) {

        var urlObj = url.parse(item);
        var domain = urlObj.host;
        domains[domain] = true;

        //create the host.crt depend on server host
        var sshObj = {
          domain: domain,
          outputPath: path.join(__dirname, '../ssl/'),
          commonname: domain,

          country: 'ZH',
          state: 'Chengdu',
          locality: 'Chengdu',
          organization: 'flutejs',
          alunit: 'flutejs',
          email: 'foolproxy@foolproxy',

          password: 'a'
        };

        //yield exec('rm -rf ' + path.join(__dirname, '../ssl/*'))

        //create main crt
        if (!myFs.isExist(path.join(__dirname, '../ssl/root.key'))) {
          fs.mkdirSync(path.join(__dirname, '../ssl'));

          yield exec(tpl('openssl genrsa -out $outputPathroot.key 2048', sshObj));
          yield exec(tpl('openssl req -x509 -new -nodes -key $outputPathroot.key -days 3650 -out $outputPathroot.crt -subj "/C=$country/ST=$state/L=$locality/O=$organization/OU=$alunit/CN=$commonname SSL Proxying/emailAddress=$email"', sshObj));
          //trust the root.crt
          yield exec('security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ' + path.join(__dirname, '../ssl/root.crt'));
        }

        //create domain.crt
        if (!myFs.isExist(path.join(__dirname, '../ssl/' + domain + '.key'))) {
          yield exec(tpl('openssl genrsa -passout pass:$password -out $outputPath$domain.key 2048', sshObj));
          yield exec(tpl('openssl rsa -in $outputPath$domain.key -passin pass:$password -out $outputPath$domain.key', sshObj));
          yield exec(tpl('openssl req -new -key $outputPath$domain.key -out $outputPath$domain.csr -passin pass:$password -subj "/C=$country/ST=$state/L=$locality/O=$organization/OU=$alunit/CN=$commonname/emailAddress=$email"', sshObj));
          yield exec(tpl('openssl x509 -req -days 365 -in $outputPath$domain.csr -CA $outputPathroot.crt -CAkey $outputPathroot.key -CAcreateserial -out $outputPath$domain.crt', sshObj));
        }

      }
    }


    //+++++++++++++++++++++++++++++++++
    // 3. create a proxy server
    //+++++++++++++++++++++++++++++++++
    httpServer = KoaHttpServer(port);

    for (var domain in domains) {
      domains[domain] = yield getPort();

      var httpsServer = KoaHttpsServer(
        fs.readFileSync(path.join(__dirname, '../ssl/' + domain + '.key')),
        fs.readFileSync(path.join(__dirname, '../ssl/' + domain + '.crt')),
        domains[domain]
      );

      httpsServers.push(httpsServer);
    }

    httpServer.server.on('connect', function (req, socket, head) {

      var domain = url.parse('http://' + req.url).hostname;

      var _url = req.url,
        proxyPort,
        proxyHost;

      if (_url == domain + ':443' && domains[domain]) {

        proxyPort = domains[domain];
        proxyHost = '127.0.0.1';

      } else {

        var array = _url.split(":");
        var host = array[0];
        var targetPort = array[1];
        proxyPort = (targetPort == 80) ? 443 : targetPort;
        proxyHost = host;
      }

      var conn = net.connect(proxyPort, proxyHost, function () {
        socket.write('HTTP/' + req.httpVersion + ' 200 Connection Established\r\n\r\n', 'UTF-8', function () {
          conn.pipe(socket).pipe(conn);
        });
      });

      conn.on("error", function (err) {
        //console.error('Connect Error '.red, err);
      });

    });

    httpsServers.forEach(function (httpsServer) {
      httpsServer.use(function*(next) {
        if (this.url.indexOf('http') != 0) {
          this.url = this.protocol + '://' + this.hostname + this.url;
        }
        yield next;
      });
    });

    httpServer.use(cors);
    gens.forEach(function (gen) {
      httpServer.use(gen);
    });
    httpServer.use(proxyRequest());

    httpsServers.forEach(function (httpsServer) {
      httpsServer.use(cors);
      gens.forEach(function (gen) {
        httpsServer.use(gen);
      });
      httpsServer.use(proxyRequest());
    });

    console.log("listening on port " + port);

  }).catch(function (err) {
    console.log('Unknown error'.red, err.stack);
  });


  // close the proxy
  function exitHandler() {
    var array = [];
    proxyArray.forEach(function (service) {
      array.push('networksetup -setwebproxystate "' + service + '" off');
      array.push('networksetup -setsecurewebproxystate "' + service + '" off');
    });
    require('child_process').exec(array.join('\n'));

    serverDestroy(httpServer && httpServer.server);
    httpsServers.forEach(function (httpsServer) {
      serverDestroy(httpsServer && httpsServer.server);
    });

    processExit();
  }

  process.on('exit', exitHandler);
  process.on('SIGINT', exitHandler);
  process.on('uncaughtException', exitHandler);

}

module.exports = proxy;
