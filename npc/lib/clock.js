//
// NPC clock
//

// const supertest = require('supertest'); // Allows calling of API routes internally 
const RPG = require('../../shared/lib/rpg')
// const Server = require('../server')
// const axios = require('axios')
const API = require('../../shared/lib/api')
require('../consts')

let moveTick = 0

async function npcClockLoop() {

  if(moveTick === 0) {
    console.log("### CLOCK: Checking for NPC movement");
    
    try {
      // Server.app give us the main Express instance
      // supertest lets us run/call HTTP routes through it
      //let app = Server.app
      let npcsResp = await API.get('god', 'entities/npc')
      for(let npc of npcsResp.entities) {      
        let willMove = RPG.skillCheck(npc.moveChance, 0)
        //console.log(`### ~ ${npc.name} ${npc.id} Moving: ${willMove}`);
        if(willMove) {
          let roomResp = await API.get('god', `room/whereis/${npc.id}`); 
          let r = RPG.rand(1, roomResp.entities.length);
          direction = roomResp.entities[r].name;
          console.log(`### ~ ${npc.name} ${npc.id} Moving: ${direction}`);
          await API.post('npc', `npcs/${npc.id}/walk`, {direction: direction});
        }
      }
    } catch(e) {
      console.error(`### ERROR: Badness trying to move NPCs ${e}`);
      
    }
  }

  // Tick forward the the moveTick counter
  moveTick = (moveTick + 1) % CLOCK_TICKS_PER_NPC_MOVE

  // Set timer to go again...
  setTimeout(npcClockLoop, CLOCK_MILLS_PER_TICK);
}

exports.npcClockLoop = npcClockLoop