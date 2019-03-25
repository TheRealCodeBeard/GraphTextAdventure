//
// API formating and sending utility functions and helpers
// Ben C, March 2019
// Notes. None
//

const ApiModel = require('./api-resp')

//
// Send a single entity
//
exports.sendOne = function(res, apiMsg, gameMsg, entity, code = 200) {
  //let entities = [ entity ]
  res.status(code).send(new ApiModel.ApiResponse(apiMsg, gameMsg, [ entity ]))
}

//
// Send multiple entities back
// Note! It's the responsibility of the caller to create a valid entities array
//
exports.sendArray = function(res, apiMsg, gameMsg, entities, code = 200) {
  res.status(code).send(new ApiModel.ApiResponse(apiMsg, gameMsg, entities))
}

//
// Send a 500 error
//
exports.send500 = function(res, apiMsg) {
  res.status(500).send(new ApiModel.ApiResponse(apiMsg, "", []))
}

//
// Send a 404 error
//
exports.send404 = function(res, apiMsg) {
  res.status(404).send(new ApiModel.ApiResponse(apiMsg, "", []))
}

//
// Send a 400 error
//
exports.send400 = function(res, apiMsg) {
  res.status(400).send(new ApiModel.ApiResponse(apiMsg, "", []))
}


exports.sendRoomMessage = function(roomId, msg) {
  require('axios').post(`${process.env.API_GOD_HOST}/api/room/${roomId}/message`, {
    message: msg
  })
  .catch(err => {
    console.log(err.toString());
    
  })
}