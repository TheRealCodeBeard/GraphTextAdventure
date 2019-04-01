var express = require('express');
var router = express.Router();
const Player = require('../../shared/lib/player');
const gremlin = require('../../shared/lib/gremlin-wrapper-v2');
const API = require('../../shared/lib/api');


router.get('/api/players/:id/look', async (req,res) => {
    try {
        let gremlinRes = await gremlin.getEntitiesOut(req.params.id, 'in')
        console.log(gremlinRes)
        if(gremlinRes.length == 0) { API.send404(res, `Player ${req.params.id} not found`); return }

        // Call the room look API and filter out the player
        let lookRes = await API.get('god', `room/${gremlinRes[0].id}/look?filter=${req.params.id}`)   
        // Send result almost as a proxy    
        API.sendOne(res, "success", lookRes.gameMsg, lookRes.entities)
    } catch(e) {
        console.error(`### ERROR: ${e.toString()}`);
        API.send500(res, e.toString())        
    }
});

router.post('/api/players/:id/name',async (req,res)=>{
    let newName = req.body.newName;
    try {
        if(!newName) throw new Error(`newName missing from body`)
        let gremlinRes = await gremlin.getEntities('player', 'id', req.params.id)
        if(gremlinRes.length == 0) { API.send404(res, `Player ${req.params.id} not found`); return }
        
        let player = gremlin.rehydrateEntity(gremlinRes[0], Player)
        let oldName = player.name
        player.name = req.body.newName
        await gremlin.updateEntity(req.params.id, player)
        API.sendOne(res, "success", `Player '${oldName}' has changed their name to '${player.name}'`, player)
    } catch(e) {
        console.error(`### ERROR: ${e.toString()}`);
        API.send500(res, e.toString())
    }
});

module.exports = router