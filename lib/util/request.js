var thunkify = require('thunkify');
var request = thunkify(require('request'));

module.exports = request;
