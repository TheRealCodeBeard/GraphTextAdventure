const Entity = require('./entity')

class Item {
  constructor(name, description) {
    // IMPORTANT EVERY ENTITY MUST DO THIS!
    Object.assign(this, new Entity())

    // Common entity fields
    this.label = 'item'    // Pretty damn important
    this.name = name 
    this.description = description
  }
}

module.exports = Item