class ApiResponse {
  constructor(apiMsg = "success", gameMsg = "", entities = []) {
    // As we're not using TypeScript, best we can do is some simple validation
    // if(let e of entities) {
    //   if(!e.hasOwnProperty('id')) console.error(`### WARNING entity is missing: id`)
    //   if(!e.hasOwnProperty('name')) console.error(`### WARNING entity is missing: name`)
    //   if(!e.hasOwnProperty('description')) console.error(`### WARNING entity is missing: description`)
    //   if(!e.hasOwnProperty('label')) console.error(`### WARNING entity is missing: label`)
    // }

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
