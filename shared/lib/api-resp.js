class ApiResponse {
  constructor(apiMsg = "success", gameMsg = "", entities = []) {
    this.apiMsg = apiMsg
    this.gameMsg = gameMsg
    this.entities = entities // MUST BE BASED ON Entity
  }
}

module.exports.ApiResponse = ApiResponse
