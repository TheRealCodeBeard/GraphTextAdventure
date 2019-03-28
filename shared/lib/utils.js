//
// Handy sleep function as Node doesn't have one
//
exports.sleep = function(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

exports.dump = function(obj) {
  console.log(require('util').inspect(obj, false, null, true /* enable colors */))
}

