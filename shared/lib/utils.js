//
// Dice!
//
exports.d3 = function() {
  return d(1, 3)
}
exports.d4 = function() {
  return d(1, 4)
}
exports.d6 = function() {
  return d(1, 6)
}
exports.d8 = function() {
  return d(1, 8)
}
exports.d10 = function() {
  return d(1, 10)
}
exports.d12 = function() {
  return d(1, 12)
}
exports.d20 = function() {
  return d(1, 20)
}
exports.d100 = function() {
  return d(1, 100)
}

//
// Used to parse dice expressions, e.g. "12 + d(2, 6)" => 12+2d6
//
exports.parse = function(str) {
  try {
    return eval(str)
  } catch(e) {
    return 0
  }
}

//
// Roll 'd' sided dice 'n' number of times
//
function d(n, d) {
  let t = 0
  for(let i = 0; i < n; i++) {
    t += Math.ceil(Math.random() * d)
  }
  return t
}
exports.d = d

//
// Check a stat (1-100) against a percentage chance check
//
exports.skillCheck = function(stat, mod) {
  return d(1, 100) <= (stat + mod)
}

//
// Handy sleep function as Node doesn't have one
//
exports.sleep = function(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}