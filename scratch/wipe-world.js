#!node

const gremlin = require('../shared/lib/gremlin-wrapper-v2')

console.log("Deleting THE WORLD!!!!!");

// Drop all NPCs
gremlin.query("g.V().drop()", {})
.then(r => {
  console.log(r)
  process.exit(0)
})
.catch(e => {})
