var express = require('express')
var router = express.Router()
const NPC = require('../lib/npc')
const API = require('../../shared/lib/api')
const gremlin = require('../../shared/lib/gremlin-wrapper-v2')


router.post('/api/npcs/create', async function (req, res, next) {
  try {
    // Get input properties and validate
    let type = req.body.type;
    let locationId = req.body.locationId;
    if(!type) throw new Error(`type missing`);
    if(!locationId) throw new Error(`locationId missing`);

    // Create a new NPC - it will have no id yet
    let npc = new NPC(type)
    
    // Store in graph
    let gremlinRes = await gremlin.createEntityLinkedTo(npc, 'in', locationId)
    if(!gremlinRes || gremlinRes.length == 0) throw new Error('No results, locationId probably does not exist')
    
    // As we're creating, push the returned id into the NPC object
    npc.id = gremlinRes[0].id

    debug(`Created NPC ${gremlinRes[0].id} in location ${locationId}`)
    API.postRoomMessage(locationId, `${npc.description} has spawned here!`)

    // Send back the NPC in an API payload with a message
    API.sendOne(res, "success", `A ${npc.npcDesc} ${npc.name} spawns`, npc)
  } catch(e) {
    console.error(`### ERROR: ${e.toString()}`);
    API.send500(res, e.toString());
  }
})


router.post('/api/npcs/:id/damage', async function (req, res, next) {
  let value = req.body.value
  let msg = ""
  try {
    debug(`Damaging NPC ${req.params.id}`)
    if(!value) throw new Error(`value missing from body`)

    let gremlinRes = await gremlin.getEntities('npc', 'id', req.params.id)
    if(gremlinRes.length == 0) { API.send404(res, `NPC ${req.params.id} not found`); return }
    
    let npc = gremlin.rehydrateEntity(gremlinRes[0], NPC)
    
    let msg = npc.takeDamage(value)
    await gremlin.updateEntity(req.params.id, npc)

    API.sendOne(res, "success", msg, npc)
  } catch(e) {
    console.error(`### ERROR: ${e.toString()}`);
    API.send500(res, e.toString())
  }
})


router.post('/api/npcs/:id/teleport', async function (req, res, next) {
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


router.post('/api/npcs/:id/walk', async function (req, res, next) {
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

// ================================================================================

function debug(m) {
  if(true)
    console.log(`### ${m}`)
}

module.exports = router