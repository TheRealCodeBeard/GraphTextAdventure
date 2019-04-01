var express = require('express');
var router = express.Router();
const Player = require('../../shared/lib/player');
const gremlin = require('../../shared/lib/gremlin-wrapper-v2');
const API = require('../../shared/lib/api');

router.post('/api/players/create', async (req,res)=>{  
    try {        
        let name = req.body.name;
        let description = req.body.description;
        let startRoomId = req.body.startRoomId;
        if(!name) throw new Error(`name missing`);
        if(!description) throw new Error(`description missing`);
        if(!startRoomId) throw new Error(`startRoomId missing`);
  
        let player = new Player(name, description);       
        let result = await gremlin.createEntityLinkedTo(player, 'in', startRoomId);
        if(!result || result.length == 0) throw new Error('No results, startRoomId probably does not exist')
        // As we're creating, push the returned id into the Item object
        player.id = result[0].id;     
  
        API.sendOne(res, "success", `The player ${name} materializes!`, player);
    } catch(e) {
        console.error(`### ERROR: ${e.toString()}`);
        API.send500(res, e.toString())
    }
});

// router.get('/api/players/:id/look', async (req,res) => {
//     try {
//         let gremlinRes = await gremlin.getEntitiesOut(req.params.id, 'in')
//         console.log(gremlinRes)
//         if(gremlinRes.length == 0) { API.send404(res, `Player ${req.params.id} not found`); return }

//         // Call the room look API and filter out the player
//         let lookRes = await API.get('god', `room/${gremlinRes[0].id}/look?filter=${req.params.id}`)   
//         // Send result almost as a proxy    
//         API.sendOne(res, "success", lookRes.gameMsg, lookRes.entities)
//     } catch(e) {
//         console.error(`### ERROR: ${e.toString()}`);
//         API.send500(res, e.toString())        
//     }
// });

// router.post('/api/players/:id/name',async (req,res)=>{
//     let newName = req.body.newName;
//     try {
//         if(!newName) throw new Error(`newName missing from body`)
//         let gremlinRes = await gremlin.getEntities('player', 'id', req.params.id)
//         if(gremlinRes.length == 0) { API.send404(res, `Player ${req.params.id} not found`); return }
        
//         let player = gremlin.rehydrateEntity(gremlinRes[0], Player)
//         let oldName = player.name
//         player.name = req.body.newName
//         await gremlin.updateEntity(req.params.id, player)
//         API.sendOne(res, "success", `Player '${oldName}' has changed their name to '${player.name}'`, player)
//     } catch(e) {
//         console.error(`### ERROR: ${e.toString()}`);
//         API.send500(res, e.toString())
//     }
// });

module.exports = router