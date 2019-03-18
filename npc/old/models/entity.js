const uuidv4 = require('uuid/v4')

class Entity {
  constructor(type) {
    this.id = `${type}/${uuidv4()}`
  }
}

module.exports = Entity
