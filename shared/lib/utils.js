//
// Handy sleep function as Node doesn't have one
//
exports.sleep = function(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

