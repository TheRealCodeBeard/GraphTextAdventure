var express = require('express');
var router = express.Router();
const Room = require('../lib/room');
const room_gremlin = require('../lib/room_gremlin');
const ApiModel = require('../../shared/models/api-resp');

router.get('/api/room/:id/look',async (req,res)=>{
    let seen = await room_gremlin.look(req.params.id);
    sendArray(res,"success",seen.description,seen.entities);
});

//dedupe with ben

let sendArray = function (res, apiMsg, gameMsg, entities, code = 200) {
    res.status(code).send(new ApiModel.ApiResponse(apiMsg, gameMsg, entities));
};

module.exports = router