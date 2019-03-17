class ApiResponse {
  constructor(apiMsg = "success", gameMsg = "", entities = []) {
    this.apiMsg = apiMsg
    this.gameMsg = gameMsg
    this.entities = entities // Should be an array of ApiEntity 
  }
}

class ApiEntity {
  constructor(id, object) {
    this.id = id
    this.data = object
  }
}

module.exports.ApiResponse = ApiResponse
module.exports.ApiEntity = ApiEntity
