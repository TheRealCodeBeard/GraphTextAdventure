var express = require('express');
var router = express.Router();

const Entity = require('../../shared/lib/entity');
const Room = require('../../shared/lib/room');
const gremlin = require('../../shared/lib/gremlin-wrapper-v2');
const API = require('../../shared/lib/api')

//
// Describe and look at a room, filterId is optional, if provided will be removed from results
// 
router.get('/api/room/:id/look', async (req, res) => {
    try {
        // Array of stuff we find to send back over the API
        let entities = []

        // Handle the room itself
        let results = await gremlin.getEntities('room', 'id', req.params.id);
        let room = gremlin.rehydrateEntity(results[0], Entity)
        entities.push(room)
        let desc = `You are in: ${room.description}\n`;

        // The things "in" the room (players and NPCs)
        results = await gremlin.getEntitiesIn(req.params.id, 'in');
        results = results.filter(r => r.id == req.query.filter ? false : true );
        desc += describeEntities(results, "You can see:", "", entities)

        // The things "held" by the room (items)
        results = await gremlin.getEntitiesOut(req.params.id, 'holds');
        results = results.filter(r => r.id == req.query.filter ? false : true );
        desc += describeEntities(results, "At your feet there are:", "", entities)

        // And the exits
        desc += "There are exits: "
        results = await gremlin.query("g.v(id).outE().where(inV().hasLabel('room'))", {id: req.params.id});
        // Paths are described by their names, not labels
        desc += results.map(d => d.properties.name).join(", ")
        // We fake the exits into pseudo entities even though they do not have names or descriptions (yet)
        results.map(d => entities.push({ id: d.id, label: d.label, name: "exit", description: d.label }))

        // Send it back
        API.sendArray(res, "success", desc, entities);
    } catch(e) {
        console.error(`### ERROR: ${e.toString()}`);
        API.send500(res, e.toString())
    }
});

//
// Get ANY entity by its ID
//
router.get('/api/entities/any/:id', async (req, res) => {
    try {
        let results = await gremlin.query("g.v(id)", {id: req.params.id});
        let e = gremlin.rehydrateEntity(results[0], Entity);
        API.sendOne(res, "success", "", e);
    } catch(e) {
        console.error(`### ERROR: ${e.toString()}`);
        API.send500(res, e.toString())
    }
});

//
// Get ALL entities by type/label
//
router.get('/api/entities/:label', async (req, res) => {
    try {
        let results = await gremlin.getEntities(req.params.label);
        let entities = []
        for(let res of results) {
            let e = gremlin.rehydrateEntity(res, Entity);
            entities.push(e)
        }
        API.sendArray(res, "success", "", entities);
    } catch(e) {
        console.log(e);
        
        console.error(`### ERROR: ${e.toString()}`);
        API.send500(res, e.toString())
    }
});

//
// Get SINGLE entity by type/label and ID (overlap with /any/:id but kept for symmetry)
//
router.get('/api/entities/:label/:id', async (req, res) => {
    try {
        let results = await gremlin.getEntities(req.params.label, 'id', req.params.id);
        let e = gremlin.rehydrateEntity(results[0], Entity);
        API.sendOne(res, "success", "", e);
    } catch(e) {
        console.log(e);
        
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
        let room = gremlin.rehydrateEntity(roomRes[0], Room);        
        room.addMessage(req.body.message);
        await gremlin.updateEntity(req.params.id, room);
        API.sendOne(res, "success", "", room);
    } catch(e) {
        console.error(`### ERROR: ${e.toString()}`);
        API.send500(res, e.toString())
    }
});


// =================================================================

function describeEntities(results, prefixText, nothingText, entities) {
    let desc = ""

    if (results && results.length > 0) {
        desc += `${prefixText}\n`;
        for(let res of results) {
            //if(res.label === 'player') continue;
            let e = gremlin.rehydrateEntity(res, Entity);
            entities.push(e)
            desc += `   (${e.name}) ${e.description}\n`
        };
    } else {
        desc += nothingText;
    }    
    return desc
}

module.exports = router