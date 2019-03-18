class ApiResponse {
  constructor(apiMsg = "success", gameMsg = "", entities = []) {
    this.apiMsg = apiMsg
    this.gameMsg = gameMsg
    this.entities = entities // MUST BE BASED ON Entity
  }
}

// class ApiEntity {
//   constructor(id, object) {
//     this.id = id
//     this.data = object
//   }
// }

module.exports.ApiResponse = ApiResponse
// module.exports.ApiEntity = ApiEntity
