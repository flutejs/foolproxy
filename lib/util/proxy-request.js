var request = require('request');

module.exports = proxyRequest;

function proxyRequest(target) {

  var r = request;

  if (target) {
    r = request.defaults({
      proxy: target
    });
  }

  return function*() {

    var url = this.req.url;
    this.body = this.req.pipe(
        r(url).on('error', function (err) {
          console.log('Forward Error'.gray, url);
        })
    );

  }
}