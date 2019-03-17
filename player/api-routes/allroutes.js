var express = require('express');
var router = express.Router();
const Player= require('../lib/player');
const player_gremlin = require('../lib/player_gremlin');
const ApiModel = require('../../shared/models/api-resp');

router.get('/api/players', async (req,res)=>{
    let players = await player_gremlin.all();
    sendArray(res,"success","",players);
});

router.get('/api/players/:id/look',async (req,res)=>{
    let seen = await player_gremlin.look(req.params.id);
    sendArray(res,"success",seen.description,seen.entities);
});

router.post('/api/players/:id/name',async (req,res)=>{
    let newName = req.body.newName;
    try{
        if (!newName) throw new Error(`new name missing from body!`);
        let players = await player_gremlin.rename(req.params.id,newName);
        sendArray(res,"success","",players);
    } catch(e) {
        res.status(500).send(new ApiModel.ApiResponse(e.toString(), "", []));
    }
});

//dedupe with ben

let sendArray = function (res, apiMsg, gameMsg, entities, code = 200) {
    res.status(code).send(new ApiModel.ApiResponse(apiMsg, gameMsg, entities));
};

module.exports = router