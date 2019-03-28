#!node

require('dotenv').config({ path: '.env' })
require('dotenv').config({ path: '../.env' })
    
const gremlin = require('../shared/lib/gremlin-wrapper-v2')
const Room = require('../shared/lib/room')

async function go() {
  // Drop all 
  gremlin.query("g.V().hasLabel('room')", {})
  .then(async res => {
    for(let r of res) {
      let room = gremlin.rehydrateEntity(r, Room)    
      room.messages = []
      await gremlin.updateEntity(room.id, room)
    }
    process.exit(0)
  })
  .catch(e => {
    console.log(e.toString());
  })
}

go();