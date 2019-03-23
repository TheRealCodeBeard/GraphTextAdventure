const Entity = require('../models/entity')

class Room {
  constructor(name, description) {
    // IMPORTANT EVERY ENTITY MUST DO THIS!
    Object.assign(this, new Entity())

    // Common entity fields
    this.label = 'room'    // Pretty damn important
    this.name = name 
    this.description = description
  }
}

module.exports = Room