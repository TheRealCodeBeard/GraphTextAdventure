var express = require('express')
var router = express.Router();
const NPC = require('../lib/npc')
const ApiModel = require('../../shared/models/api-resp')
//const ApiModel = require('../../shared/models/api-resp')

const gremlin = require('../../shared/lib/gremlin_wrapper');

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
  let type = req.body.type
  let locationId = req.body.locationId

  try {
    if(!type) throw new Error(`type missing`)
    if(!locationId) throw new Error(`locationId missing`)

    let npc = NPC.create(type)
    let gremlinRes = await gremlin.create_npc(npc, locationId)
    console.log(`### DEBUG: Created ${gremlinRes[0].label} ${gremlinRes[0].id} in location ${locationId}`)
    sendOne(res, "success", "", npc, gremlinRes[0].id)
  } catch(e) {
    console.error(`### ERROR: ${e.toString()}`);
    send500(res, e.toString())
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
    let gremlinRes = await gremlin.get_npcs('id', req.params.id)
    if(gremlinRes.length == 0) { send404(res, `NPC ${req.params.id} not found`); return }
    
    console.log(`### DEBUG: Got ${gremlinRes[0].label} ${gremlinRes[0].id}`)
    let npc = NPC.hydrateFromGremlin(gremlinRes)
    sendOne(res, "success", "", npc, req.params.id)
  } catch(e) {
    console.error(`### ERROR: ${e.toString()}`);
    send500(res, e.toString())
  }
})


/**
 * Describe an NPC
 * @route GET /npcs/{id}/describe
 * @group NPCs - Operations on NPCs
 * @param {string} id.path.required - The id of the NPC
 * @returns {ApiResp.model} 200 - An ApiResp object
 * @returns {Error} 404 - NPC not found
 * @returns {Error} default - Unexpected error
 */
router.get('/api/npcs/:id/describe', async function (req, res, next) {
  try {
    let gremlinRes = await gremlin.get_npcs('id', req.params.id)
    if(gremlinRes.length == 0) { send404(res, `NPC ${req.params.id} not found`); return }
    
    console.log(`### DEBUG: Got ${gremlinRes[0].label} ${gremlinRes[0].id}`)
    let npc = NPC.hydrateFromGremlin(gremlinRes)
    let desc = npc.describeVerbose()
    sendOne(res, "success", desc, npc, req.params.id)
  } catch(e) {
    console.error(`### ERROR: ${e.toString()}`);
    send500(res, e.toString())
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
  let gremlinResults = await gremlin.get_npcs('label', 'npc')
  let entities = []
  for(let gremlinRes of gremlinResults) {
    let npc = NPC.hydrate(gremlinRes.properties.jsonString[0].value)
    entities.push({ id: gremlinRes.id, data: npc})
  }
  sendArray(res, "success", "", entities)
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
    if(!value) throw new Error(`value missing from body`)

    let gremlinRes = await gremlin.get_npcs('id', req.params.id)
    if(gremlinRes.length == 0) { send404(res, `NPC ${req.params.id} not found`); return }
    
    console.log(`### DEBUG: Got ${gremlinRes[0].label} ${gremlinRes[0].id}`)
    let npc = NPC.hydrateFromGremlin(gremlinRes)

    let msg = npc.takeDamage(value)
    await gremlin.update_npc(req.params.id, npc)

    sendOne(res, "success", msg, npc, req.params.id)
  } catch(e) {
    console.error(`### ERROR: ${e.toString()}`);
    send500(res, e.toString())
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
    await gremlin.query_promise("g.v('id', id).outE('label', 'in').drop()", {id: req.params.id})
    await gremlin.query_promise("g.v('id', id).addE('in').to( g.V('id', locationId) )", {id: req.params.id, locationId: req.params.locationId})

    sendOne(res, "success", "The NPC moves to another location", null, null)
  } catch(e) {
    console.error(`### ERROR: ${e.toString()}`);
    send500(res, e.toString())
  }
})

// ================================================================================
// Util functions here
// ================================================================================

function sendOne(res, apiMsg, gameMsg, npc, npcId, code = 200) {
  let entities = [ new ApiModel.ApiEntity(npcId, npc) ]
  res.status(code).send(new ApiModel.ApiResponse(apiMsg, gameMsg, entities))
}

function sendArray(res, apiMsg, gameMsg, entities, code = 200) {
  res.status(code).send(new ApiModel.ApiResponse(apiMsg, gameMsg, entities))
}

function send500(res, apiMsg) {
  res.status(500).send(new ApiModel.ApiResponse(apiMsg, "", []))
}

function send404(res, apiMsg) {
  res.status(404).send(new ApiModel.ApiResponse(apiMsg, "", []))
}

module.exports = router