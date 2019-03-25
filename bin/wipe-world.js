#!node

require('dotenv').config({ path: '.env' })
require('dotenv').config({ path: '../.env' })

const gremlin = require('../shared/lib/gremlin-wrapper-v2')

console.log("Deleting THE WORLD!!!!!");

// Drop all NPCs
gremlin.query("g.V().drop()", {})
.then(r => {
  console.log(r)
  process.exit(0)
})
.catch(e => {})
