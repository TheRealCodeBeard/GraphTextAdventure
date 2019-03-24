var express = require('express')
var router = express.Router()
const NPC = require('../lib/npc')
const API = require('../../shared/lib/api')

const gremlin = require('../../shared/lib/gremlin-wrapper-v2')

/**
 * @typedef ApiResp
 * @property {string} apiMsg.required - System message relating to API call
 * @property {string} gameMsg.required - Game message or text to display to player
 * @property {Array.<object>} entities - Array of game entities
 */
/**
 * @typedef CreateNPCRequest
 * @property {string} type.required - Example: orc
 * @property {string} locationId.required - Location to spawn NPC in
 */

/**
 * Create a new NPC in a given location
 * @route POST /npcs/create
 * @group NPCs - Operations on NPCs
 * @param {CreateNPCRequest.model} npc.body.required - The request to create NPC
 * @returns {ApiResp.model} 200 - An ApiResp object
 * @returns {Error} 404 - NPC type not found
 * @returns {Error} default - Unexpected error
 */
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
    
    // Send back the NPC in an API payload with a message
    API.sendOne(res, "success", `A ${npc.npcDesc} ${npc.name} spawns`, npc)
  } catch(e) {
    console.error(`### ERROR: ${e.toString()}`);
    API.send500(res, e.toString());
  }
})


/**
 * Get a single NPC by id
 * @route GET /npcs/{id}
 * @group NPCs - Operations on NPCs
 * @param {string} id.path.required - The id of the NPC
 * @returns {ApiResp.model} 200 - An ApiResp object
 * @returns {Error} 404 - NPC not found
 * @returns {Error} default - Unexpected error
 */
router.get('/api/npcs/:id', async function (req, res, next) {
  try {
    debug(`Fetching NPC ${req.params.id}`)
    let gremlinRes = await gremlin.getEntities('npc', 'id', req.params.id)
    if(gremlinRes.length == 0) { API.send404(res, `NPC ${req.params.id} not found`); return }
  
    let npc = gremlin.rehydrateEntity(gremlinRes[0], NPC)
    API.sendOne(res, "success", "", npc)
  } catch(e) {
    console.error(`### ERROR: ${e.toString()}`);
    API.send500(res, e.toString())
  }
})


/**
 * Return all NPCs
 * @route GET /npcs
 * @group NPCs - Operations on NPCs
 * @returns {ApiResp.model} 200 - An ApiResp object
 * @returns {Error} default - Unexpected error
 */
router.get('/api/npcs', async function (req, res, next) {
  debug(`Listing ALL NPCs`)

  // we pass a redundant filter to fetch ALL npcs
  let gremlinResults = await gremlin.getEntities('npc', 'label', 'npc')
  let entities = []
  for(let gremlinRes of gremlinResults) {
    let npc = gremlin.rehydrateEntity(gremlinRes, NPC)
    entities.push(npc)
  }
  API.sendArray(res, "success", "", entities)
})


/**
 * Try to damage an NPC
 * @route POST /npcs/{id}/damage
 * @group NPCs - Operations on NPCs
 * @param {string} id.path.required - The id of the agent 
 * @param {Interaction.model} interaction.body.required - The interaction request
 * @returns {ApiResp.model} 200 - An ApiResp object
 * @returns {Error} 404 - NPC not found
 * @returns {Error} default - Unexpected error
 */
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


/**
 * Move an NPC to a new location
 * @route PUT /npcs/{id}/move/{locationId}
 * @group NPCs - Operations on NPCs
 * @param {string} id.path.required - The id of the agent 
 * @param {string} locationId.path.required - The id of the location
 * @returns {ApiResp.model} 200 - An ApiResp object
 * @returns {Error} 404 - NPC not found
 * @returns {Error} default - Unexpected error
 */
router.put('/api/npcs/:id/move/:locationId', async function (req, res, next) {
  try {
    // await gremlin.query("g.v('id', id).outE('label', 'in').drop()", {id: req.params.id})
    // await gremlin.query("g.v('id', id).addE('in').to( g.V('id', locationId) )", {id: req.params.id, locationId: req.params.locationId})
    await gremlin.moveEntityOut(req.params.id, 'in', req.params.locationId)

    API.sendOne(res, "success", "The NPC moves to another location", {})
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