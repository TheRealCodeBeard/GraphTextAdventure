const gremlin = require('../shared/lib/gremlin_wrapper')

// Drop all NPCs
gremlin.query_promise("g.V().hasLabel('npc').drop()", {})
.then(r => {
  console.log(r)
  process.exit(0)
})
.catch(e => {})