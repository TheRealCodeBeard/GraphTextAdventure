//
// NPC clock
//

const supertest = require('supertest'); // Allows calling of API routes internally 
const RPG = require('../../shared/lib/rpg')
const Server = require('../server')
require('../../shared/consts')

let moveTick = 0

async function npcClockLoop() {

  if(moveTick === 0) {
    console.log("### CLOCK: Checking for NPC movement");
    
    // Server.app give us the main Express instance
    // supertest lets us run/call HTTP routes through it
    let app = Server.app
    let npcsResp = await supertest(app).get('/api/npcs')
    for(let npc of npcsResp.body.entities) {
      let willMove = RPG.skillCheck(npc.moveChance, 0)
      console.log(`${npc.name} ${npc.id} Moving: ${willMove}`);
      if(willMove) {
        let moveResp = await supertest(app).put(`/api/npcs/${npc.id}/move/b80c8112-f389-49a7-8cf6-4aad3b3ec601`)
      }
    }
  }

  // Tick forward the the moveTick counter
  moveTick = (moveTick + 1) % CLOCK_TICKS_PER_NPC_MOVE

  // Set timer to go again...
  setTimeout(npcClockLoop, CLOCK_MILLS_PER_TICK);
}

exports.npcClockLoop = npcClockLoop