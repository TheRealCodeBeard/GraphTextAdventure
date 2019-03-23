#!node

const gremlin = require('../shared/lib/gremlin-wrapper-v2')

console.log("Deleting ALL NPCs !!");

// Drop all NPCs
gremlin.query("g.V().hasLabel('npc').drop()", {})
.then(r => {
  console.log(r)
  process.exit(0)
})
.catch(e => {})
