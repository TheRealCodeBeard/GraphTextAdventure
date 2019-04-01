var express = require('express');
var router = express.Router();

const colors = require('colors');
const Entity = require('../../shared/lib/entity');
const Room = require('../../shared/lib/room');
const gremlin = require('../../shared/lib/gremlin-wrapper-v2');
const API = require('../../shared/lib/api')

require('../consts')

//
// Describe and look at a room, filterId is optional, if provided will be removed from results
// 
router.get('/api/room/:id/look', async (req, res) => {
  try {
      // Array of stuff we find to send back over the API
      let entities = []

      // Handle the room itself
      let results = await gremlin.getEntities('room', 'id', req.params.id);
      if(results.length == 0) { API.send404(res, `Room ${req.params.id} not found`); return }

      let room = gremlin.rehydrateEntity(results[0], Entity);
      entities.push(room);
      let desc = `You are in: ${room.description}\n`;

      // The things "in" the room (players and NPCs)
      results = await gremlin.getEntitiesIn(req.params.id, 'in');
      desc += describeEntities(results, "Here with you:".cyan, "", entities, req.query.filter);

      // The things "held" by the room (items)
      results = await gremlin.getEntitiesOut(req.params.id, 'holds');
      desc += describeEntities(results, "At your feet you see:".cyan, "", entities, req.query.filter);

      // And the exits
      desc += "There are exits: ".cyan;
      results = await gremlin.query("g.v(id).outE().where(inV().hasLabel('room'))", {id: req.params.id});
      // Paths are described by their names, not labels
      desc += results.map(d => d.properties.name).join(", ");
      // We fake the exits into pseudo entities even though they do not have names or descriptions (yet)
      results.map(edge => entities.push(makeEntityFromPath(edge)));

      // Send it back
      API.sendArray(res, "success", desc, entities);
  } catch(e) {
      console.error(`### ERROR: ${e.toString()}`);
      API.send500(res, e.toString())
  }
});


//
// Post a message to the room's postbox
//
router.post('/api/room/:id/message', async (req, res) => {
  try {
      let roomRes = await gremlin.getEntities('room', 'id', req.params.id);      
      if(roomRes.length == 0) { API.send404(res, `Room ${req.params.id} not found`); return }

      let room = gremlin.rehydrateEntity(roomRes[0], Room);        
      room.addMessage(req.body.message);
      await gremlin.updateEntity(req.params.id, room);
      API.sendOne(res, "success", "", room);
  } catch(e) {
      console.error(`### ERROR: ${e.toString()}`);
      API.send500(res, e.toString())
  }
});


//
// Locate the room a player/NPC is in
// entity array results; 0 = the room, 1+ = the paths/exits
//
router.get('/api/room/whereis/:id', async (req, res) => {
  try {
      entities = []
      let roomRes = await gremlin.getEntitiesOut(req.params.id, 'in'); 
      if(roomRes.length == 0) { API.send404(res, `Agent ${req.params.id} not found`); return }
      entities.push(gremlin.rehydrateEntity(roomRes[0], Room))

      let exitsRes = await gremlin.query("g.v(id).outE().where(inV().hasLabel('room'))", {id: roomRes[0].id});
      //if(exitsRes.length == 0) { API.send404(res, `Room/Agent ${req.params.id} not found`); return }
      
      // We fake the exits into pseudo entities even though they do not have names or descriptions (yet)
      exitsRes.map(edge => entities.push(makeEntityFromPath(edge)));
      API.sendArray(res, "success", "", entities);
  } catch(e) {
      console.error(`### ERROR: ${e.toString()}`);
      API.send500(res, e.toString())
  }
});


//
// Create a room linked to existing room
//
router.post('/api/room/:id/create', async (req, res) => {
  try {  
    let name = req.body.name;
    let description = req.body.description;
    let direction = req.body.direction;
    if(!name) throw new Error(`name missing`);
    if(!description) throw new Error(`description missing`);
    if(!direction) throw new Error(`direction missing`);

    direction = direction.toLowerCase()

    if(!WORLD_DIRECTIONS[direction]) {
      API.send400(res, `Direction '${direction}' is invalid. Permitted directions are: ${Object.keys(WORLD_DIRECTIONS)}`);
      return;
    }

    let exitsRes = await gremlin.getLinksByLabel(req.params.id, 'path');

    let existing = exitsRes.find(p => p.properties.name === direction)
    if(existing) {
      API.send400(res, `There is already a path leading '${direction}' from this room`);
      return;      
    }
    
    let newRoom = new Room(name, description);
    let oppositeDirection = WORLD_DIRECTIONS[direction];
    let result = await gremlin.createEntityLinkedTo(newRoom, 'path', req.params.id, oppositeDirection)
    
    if(result.length == 0) { API.send404(res, `Room ${req.params.id} not found`); return }
    newRoom.id = result[0].id;

    // Create a link of type 'path' and name = direction back to the room
    await gremlin.createLinkTo(req.params.id, 'path', newRoom.id, direction)

    API.sendOne(res, "success", `The room '${newRoom.name}' was created!`, newRoom);
  } catch(e) {
      console.error(`### ERROR: ${e.toString()}`);
      API.send500(res, e.toString())
  }
});

//
// Create a new UNLINKED room
// Only currently used when bootstraping a new world
//
router.post('/api/room', async (req, res) => {  
  try {  
    let name = req.body.name;
    let description = req.body.description;
    if(!name) throw new Error(`name missing`);
    if(!description) throw new Error(`description missing`);

    let newRoom = new Room(name, description);
    let result = await gremlin.createEntity(newRoom)
    newRoom.id = result[0].id;

    API.sendOne(res, "success", `The room '${newRoom.name}' was created!`, newRoom);
  } catch(e) {
      console.error(`### ERROR: ${e.toString()}`);
      API.send500(res, e.toString())
  }
});

module.exports = router;

// =================================================================

function describeEntities(results, prefixText, nothingText, entities, filter) {
  let desc = ""
  if (results && results.length > 0) {
      desc += `${prefixText}\n`;
      for(let res of results) {
          if(res.id == filter) continue;
          let entity = gremlin.rehydrateEntity(res, Entity);
          entities.push(entity);
          desc += `   (${entity.name.grey}) ${entity.description}\n`.white;
      };
  } else {
      desc += nothingText;
  }    
  return desc
}

function makeEntityFromPath(edge) {
  return {
      id: edge.id,
      label: edge.label,
      name: edge.properties.name,
      description: edge.label,
      destinationId: edge.inV,
      sourceId: edge.outV
  }
}
