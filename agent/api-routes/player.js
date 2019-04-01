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

module.exports = router