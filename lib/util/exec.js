var thunkify = require('thunkify');
var exec = thunkify(require('child_process').exec);

module.exports = exec;