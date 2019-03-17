const Utils = require('../shared/lib/utils')
const axios = require('axios')

// Config and consts
require('../shared/consts')
const config = require("../config");

console.log(`### Starting game clock...`);

// Game clock
async function gameClockLoop() {
  while(true) {
    console.log(`### Tick...`);
    
    try {
      let npcs = await axios.get(`${config.npcURL}/api/npcs`);
      if(!npcs || !npcs.data) throw new Error(`No NPCs returned from API`)
      for(let npcData of npcs.data.entities) {
        let doMove = Utils.skillCheck(npcData.data.moveChance, 0)
        console.log(doMove);
      }
    } catch(e) {
      console.error(e.toString());
    }

    await Utils.sleep(CLOCK_SECS_PER_TICK * 1000);
  }
}

gameClockLoop();