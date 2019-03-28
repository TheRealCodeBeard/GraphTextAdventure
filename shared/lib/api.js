//
// API formating and sending utility functions and helpers
// Ben C, March 2019
// Notes. None
//

const axios = require('axios') 

exports.ApiResponse = class ApiResponse {
  constructor(apiMsg = "success", gameMsg = "", entities = []) {
    this.apiMsg = apiMsg
    this.gameMsg = gameMsg
    this.entities = entities // MUST BE BASED ON Entity
  }
}

//
// Send a single entity
//
exports.sendOne = function(res, apiMsg, gameMsg, entity, code = 200) {
  //let entities = [ entity ]
  res.status(code).send(new exports.ApiResponse(apiMsg, gameMsg, [ entity ]))
}

//
// Send multiple entities back
// Note! It's the responsibility of the caller to create a valid entities array
//
exports.sendArray = function(res, apiMsg, gameMsg, entities, code = 200) {
  res.status(code).send(new exports.ApiResponse(apiMsg, gameMsg, entities))
}

//
// Send a 500 error
//
exports.send500 = function(res, apiMsg) {
  res.status(500).send(new exports.ApiResponse(apiMsg, "", []))
}

//
// Send a 404 error
//
exports.send404 = function(res, apiMsg) {
  res.status(404).send(new exports.ApiResponse(apiMsg, "", []))
}

//
// Send a 400 error
//
exports.send400 = function(res, apiMsg) {
  res.status(400).send(new exports.ApiResponse(apiMsg, "", []))
}


// ======== Client helpers ========

//
// Post a message to a room
//
exports.postRoomMessage = function(roomId, msg) {
  return exports.post('GOD', `room/${roomId}/message`, {message: msg})
}

//
// Generic GET wrapper
//
exports.get = function(service, uri) {
  return _axiosCall('get', service, uri)
}

//
// Generic POST wrapper
//
exports.post = function(service, uri, data) {
  return _axiosCall('post', service, uri, data)
}

//
// Private API call wrapper for Axios
//
_axiosCall = async function(method, service, uri, data = null) {
  try {
    let url = ""
    switch(service.toUpperCase()) {
      case 'BASE': url = `${process.env.API_BASE_HOST}/api/${uri}`; break;
      case 'GOD': url = `${process.env.API_GOD_HOST}/api/${uri}`; break;
      case 'NPC': url = `${process.env.API_NPC_HOST}/api/${uri}`; break;
      case 'PLAYER': url = `${process.env.API_PLAYER_HOST}/api/${uri}`; break;
    }    
    if(!url) throw new Error('Invalid API service requested must be one of: BASE, GOD, NPC, PLAYER')

    let req = { 
      method: method, 
      url: url, 
      data: data 
    }
    //console.log(req);
    
    let resp = await axios(req)

    if(!resp) throw new Error('No response from API')
    if(!resp.data) throw new Error(`API response contained no data. Status: ${resp.status}`)

    return resp.data
  } catch(e) {
    console.error(`### API Error! [${method}, ${service}, ${uri}] failed: ${e.toString()}`)
  }
}