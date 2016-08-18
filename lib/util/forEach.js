var co = require('co');
var thunkify = require('thunkify');

module.exports = thunkify(forEach);

function forEach(array, gen, callback) {
  if (array.length==0){
    callback(null,[]);
    return;
  }
  var result = [];
  array.forEach(function(item, index) {
    result[index] = {
      err:null
    };

    co(function * () {
      try {
        result[index].value = yield gen(item, index);
      } catch (err) {
        result[index].err = err;
      }
      if (index == array.length - 1) {
        callback(null,result);
      }
    }).catch(function(err){
      console.log(err.stack);
    });
  });
}