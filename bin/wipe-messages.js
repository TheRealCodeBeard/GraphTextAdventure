#!node

require('dotenv').config({ path: '.env' })
require('dotenv').config({ path: '../.env' })
    
const gremlin = require('../shared/lib/gremlin-wrapper-v2')
const Room = require('../shared/lib/room')

// Drop all 
gremlin.query("g.V().hasLabel('room')", {})
.then(res => {
  for(let r of res) {
    let room = gremlin.rehydrateEntity(r, Room)
    room.messages = []
    gremlin.updateEntity(r.id, room)
  }
  process.exit(0)
})
.catch(e => {})
