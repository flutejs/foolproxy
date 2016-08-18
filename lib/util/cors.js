module.exports = cors;

function * cors(next) {
  this.set('Access-Control-Allow-Origin','*');
  yield next;
}