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

exports.parse = function(str) {
  try {
    return eval(str)
  } catch(e) {
    return 0
  }
}

function d(n, d) {
  let t = 0
  for(let i = 0; i < n; i++) {
    t += Math.ceil(Math.random() * d)
  }
  return t
}
exports.d = d
