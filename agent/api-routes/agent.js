var express = require('express')
var router = express.Router()
const API = require('../../shared/lib/api')
const Item = require('../../shared/lib/item')
const gremlin = require('../../shared/lib/gremlin-wrapper-v2')

router.post('/api/agent/:id/teleport', async function (req, res, next) {
  let location = req.body.location;
  try {
    debug(`Teleporting NPC ${req.params.id}`)
    if(!location) throw new Error(`locationId missing from body`)  
      
    await gremlin.moveEntityOut(req.params.id, 'in', location)
    API.postRoomMessage(location, `A NPC has beamed in`)

    API.sendOne(res, "success", "The NPC teleports to another location", {})
  } catch(e) {
    console.error(`### ERROR: ${e.toString()}`);
    API.send500(res, e.toString())
  }
})


router.post('/api/agent/:id/walk', async function (req, res, next) {
  let direction = req.body.direction.toLowerCase();
  try {
    if(!direction) throw new Error(`direction missing from body`)    
    debug(`Walking NPC ${req.params.id} ${direction}`)

    let npc = await API.get('god', `entities/any/${req.params.id}`) 

    let whereRes = await API.get('god', `room/whereis/${req.params.id}`) 
    
    let matchDir = whereRes.entities.find(d => { return d.label == 'path' && d.name == direction}) 
    if(matchDir) {    
      await gremlin.moveEntityOut(req.params.id, 'in', matchDir.destinationId)
      await API.postRoomMessage(matchDir.destinationId, `The ${npc.entities[0].name} has entered`)      
      await API.postRoomMessage(matchDir.sourceId, `The ${npc.entities[0].name} has gone ${direction}`)      
    } else {
      API.sendOne(res, "success", "There is no way to go "+direction, {})
      return;
    }

    API.sendOne(res, "success", `You successfully go ${direction}`, {})
  } catch(e) {
    console.error(`### ERROR: ${e.toString()}`);
    API.send500(res, e.toString())
  }
})


router.get('/api/agent/:id/items', async function (req, res, next) {
  try {
    let holdsResp = await gremlin.getEntitiesOut(req.params.id, 'holds');
    let entities = holdsResp.map(i => gremlin.rehydrateEntity(i, Item))
    API.sendArray(res, "success", "You are holding", entities)
  } catch(e) {
    console.error(`### ERROR: ${e.toString()}`);
    API.send500(res, e.toString())
  }
})

// ================================================================================

function debug(m) {
  if(true)
    console.log(`### ${m}`)
}

module.exports = router