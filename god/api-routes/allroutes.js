var express = require('express');
var router = express.Router();

const Entity = require('../../shared/models/entity');
const gremlin = require('../../shared/lib/gremlin-wrapper-v2');

const API = require('../../shared/lib/api')

//
// Describe and look at a room, filterId is optional, if provided will be removed from results
// 
router.get('/api/room/:id/look/:filterId?', async (req,res) => {
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
        results = results.filter(r => r.id == req.params.filterId ? false : true );
        desc += describeEntities(results, "You can see:", "", entities)

        // The things "held" by the room (items)
        results = await gremlin.getEntitiesOut(req.params.id, 'holds');
        results = results.filter(r => r.id == req.params.filterId ? false : true );
        desc += describeEntities(results, "At your feet there are:", "", entities)

        // And the exits
        desc += "There are exits: "
        results = await gremlin.query("g.v(id).outE().where(inV().hasLabel('room'))", {id: req.params.id});
        desc += results.map(d => d.label).join(", ")
        // We fake the exits into pseudo entities even though they do not have names or descriptions (yet)
        results.map(d => entities.push({ id: d.id, label: d.label, name: "exit", description: d.label }))

        // Send it back
        API.sendArray(res, "success", desc, entities);
    } catch(e) {
        console.error(`### ERROR: ${e.toString()}`);
        API.send500(res, e.toString())
    }
});

router.get('/api/entities/:id', async (req,res) => {
    try {
        let results = await gremlin.query("g.v(id)", {id: req.params.id});
        let e = gremlin.rehydrateEntity(results[0], Entity);
        API.sendOne(res, "success", "", e);
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