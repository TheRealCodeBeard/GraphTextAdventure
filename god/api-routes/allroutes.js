var express = require('express');
var router = express.Router();

const Entity = require('../../shared/models/entity');
const gremlin = require('../../shared/lib/gremlin-wrapper-v2');

const API = require('../../shared/lib/api')

router.get('/api/room/:id/look', async (req,res) => {
    
    let entities = []
    // Handle the room itself
    let results = await gremlin.getEntities('room', 'id', req.params.id);
    let room = gremlin.rehydrateEntity(results[0], Entity)
    entities.push(room)
    let desc = `You are in: ${room.description}\n`;

    // The things "in" the room (players and NPCs)
    results = await gremlin.getEntitiesIn(req.params.id, 'in');
    desc += listEntities(results, "You can see:", "", entities)

    // The things "held" by the room (items)
    results = await gremlin.getEntitiesOut(req.params.id, 'holds');
    desc += listEntities(results, "At your feet there are:", "", entities)

    // And the exits
    desc += "There are exits: "
    results = await gremlin.query("g.v(id).outE().where(inV().hasLabel('room'))", {id: req.params.id});
    desc += results.map(d => d.label).join(", ")
    // We fake the exits into pseodo entities even though they do not have names or descriptions (yet)
    results.map(d => entities.push({ id: d.id, label: d.label, name: "exit", description: d.label }))

    // We could send all the entities back, but 
    API.sendArray(res, "success", desc, entities);
});

// =================================================================

function listEntities(results, prefixText, nothingText, entities) {
    let desc = ""

    // You here, but are alone
    if(results.length == 1 && results[0].label === 'player') return ""

    if (results && results.length > 0) {
        desc += `${prefixText}\n`;
        for(let res of results) {
            if(res.label === 'player') continue;
            let e = gremlin.rehydrateEntity(res, Entity);
            entities.push(e)
            desc += `   ${e.description}\n`
        };
    } else {
        desc += nothingText;
    }    
    return desc
}

module.exports = router