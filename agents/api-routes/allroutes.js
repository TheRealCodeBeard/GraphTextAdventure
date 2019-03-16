var express = require('express')
var router = express.Router();
const NPC = require('../lib/npc')
const ApiResponse = require('../lib/models/api-resp')
//const Utils = require('../lib/utils')

var db = {}

/**
 * @typedef ApiResp
 * @property {string} apiMsg.required - System message relating to API call
 * @property {string} gameMsg.required - Game message or text to display to player
 * @property {Array.<Entity>} entities - Array of game entities
 */
/**
 * @typedef Entity
 * @property {string} id.required - Entity id
 */
/**
 * @typedef CreateNPCRequest
 * @property {string} type.required - Example: orc
 * @property {string} locationId.required - Location to spawn NPC in
 */
/**
 * @typedef Interaction
 * @property {string} action.required - Action type, e.g. damage, give, scare
 * @property {object} data.required - Action dependant, might be an int, or an Item etc
 */


/**
 * Create a new NPC in a given location
 * @route POST /agents/create/npc
 * @group agents - Operations on agents
 * @param {CreateNPCRequest.model} npc.body.required - The request to create NPC
 * @returns {ApiResp.model} 200 - An ApiResp object
 * @returns {Error} 404 - NPC type not found
 * @returns {Error} default - Unexpected error
 */
router.post('/api/agents/create/npc', function (req, res, next) {
  let type = req.body.type
  let locationId = req.body.locationId

  try { 
    let npc = NPC.create(type)
    db[npc.id] = npc
    npc.moveTo(locationId)
    sendResp(res, "success", "", [ npc ])
  } catch(e) {
    sendResp(res, e.toString(), "", [], 500)
  }
})


/**
 * Get a single agent by id
 * @route GET /agent/{id}
 * @group agents - Operations on agents
 * @param {string} id.path.required - The id of the agent
 * @returns {ApiResp.model} 200 - An ApiResp object
 * @returns {Error} 404 - Agent not found
 * @returns {Error} default - Unexpected error
 */
router.get('/api/agents/:id', function (req, res, next) {
  let agent = db[`agents/${req.params.id}`]

  if(agent)
    sendResp(res, "success", "", [ agent ])
  else
    sendResp(res, `Agent ${req.params.id} not found`, "", [], 404)
})


/**
 * Describe an agent
 * @route GET /agents/{id}/describe
 * @group agents - Operations on agents
 * @param {string} id.path.required - The id of the agent
 * @returns {ApiResp.model} 200 - An ApiResp object
 * @returns {Error} 404 - Agent not found
 * @returns {Error} default - Unexpected error
 */
router.get('/api/agents/:id/describe', function (req, res, next) {
  let agent = db[`agents/${req.params.id}`]

  if(agent) {
    let desc = agent.describe()
    sendResp(res, "success", desc, [ agent ])
  } else {
    sendResp(res, `Agent ${req.params.id} not found`, "", [], 404)
  }
})


/**
 * Return all agents
 * @route GET /agents
 * @group agents - Operations on agents
 * @returns {ApiResp.model} 200 - An ApiResp object
 * @returns {Error} default - Unexpected error
 */
router.get('/api/agents/', function (req, res, next) {
  let agentList = []
  for(let agentId in db) agentList.push(db[agentId])
  sendResp(res, "success", "", agentList)
})


/**
 * Try to interact with an agent
 * @route POST /agents/{id}/interact
 * @group agents - Operations on agents
 * @param {string} id.path.required - The id of the agent 
 * @param {Interaction.model} interaction.body.required - The interaction request
 * @returns {ApiResp.model} 200 - An ApiResp object
 * @returns {Error} 404 - Agent not found
 * @returns {Error} default - Unexpected error
 */
router.post('/api/agents/:id/interact', function (req, res, next) {

  let agent = db[`agents/${req.params.id}`]
  let interaction = req.body
  let msg = ""

  if(agent) {
    switch(interaction.action) {
      case 'damage':
        let dmg = parseInt(interaction.data)
        msg = agent.takeDamage(dmg)
        break
      default:
        msg = "Unknown interaction"
    }
    
    sendResp(res, "success", msg, [ agent ])
  } else {
    sendResp(res, `Agent ${req.params.id} not found`, "", [], 404)
  }
})


/**
 * Move an agent to a new location
 * @route PUT /agent/{id}/move/{locationId}
 * @group agents - Operations on agents
 * @param {string} id.path.required - The id of the agent 
 * @param {string} locationId.path.required - The id of the location
 * @returns {ApiResp.model} 200 - An ApiResp object
 * @returns {Error} 404 - Agent not found
 * @returns {Error} default - Unexpected error
 */
router.put('/api/agents/:id/move/:locationId', function (req, res, next) {
  let agent = db[`agents/${req.params.id}`]
  if(agent) {
    let msg = agent.moveTo(req.params.locationId)
    sendResp(res, "success", msg, [ agent ])
  } else {
    sendResp(res, `Agent ${req.params.id} not found`, "", [], 404)
  }
})

// ================================================================================
// Util functions here
// ================================================================================

function sendResp(res, apiMsg, gameMsg, entities = [], code = 200) {
  res.status(code).send(new ApiResponse(apiMsg, gameMsg, entities))
}

module.exports = router