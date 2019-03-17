var express = require('express');
var router = express.Router();
const Player= require('../lib/player');
const player_gremlin = require('../lib/player_gremlin');
const ApiModel = require('../../shared/models/api-resp');

router.get('/api/players', async (req,res)=>{
    players = await player_gremlin.all();
    sendArray(res,"success","",players);
});

let sendArray = function (res, apiMsg, gameMsg, entities, code = 200) {
    res.status(code).send(new ApiModel.ApiResponse(apiMsg, gameMsg, entities));
};

module.exports = router