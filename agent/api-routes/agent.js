var express = require('express')
var router = express.Router()
const API = require('../../shared/lib/api')
const Item = require('../../shared/lib/item')
const Room = require('../../shared/lib/room')
const gremlin = require('../../shared/lib/gremlin-wrapper-v2')

router.post('/api/agents/:id/teleport', async function (req, res, next) {
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


router.post('/api/agents/:id/walk', async function (req, res, next) {
  let direction = req.body.direction.toLowerCase();
  try {
    if(!direction) throw new Error(`direction missing from body`)    
    debug(`Walking NPC ${req.params.id} ${direction}`)

    let agentRes = await API.get('god', `entities/any/${req.params.id}`)
    if(agentRes.length == 0) { API.send404(res, `Agent ${req.params.id} not found`); return }

    let whereRes = await API.get('god', `room/whereis/${req.params.id}`) 
    
    let matchDir = whereRes.entities.find(d => { return d.label == 'path' && d.name == direction}) 
    if(matchDir) {    
      await gremlin.moveEntityOut(req.params.id, 'in', matchDir.destinationId)
      await API.postRoomMessage(matchDir.destinationId, `The ${agentRes.entities[0].name} has entered`)      
      await API.postRoomMessage(matchDir.sourceId, `The ${agentRes.entities[0].name} has gone ${direction}`)      
    } else {
      API.sendArray(res, "success", "There is no way to go "+direction, [])
      return;
    }

    let newRoomRes = await gremlin.getEntityById(matchDir.destinationId)
    API.sendOne(res, "success", `You successfully go ${direction}`, gremlin.rehydrateEntity(newRoomRes[0], Room))
  } catch(e) {
    console.error(`### ERROR: ${e.toString()}`);
    API.send500(res, e.toString())
  }
})


router.get('/api/agents/:id/items', async function (req, res, next) {
  try {
    let holdsResp = await gremlin.getEntitiesOut(req.params.id, 'holds');
    // console.log(holdsResp);
    
    let entities = holdsResp.map(i => gremlin.rehydrateEntity(i, Item))
    // console.log(entities);
    
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