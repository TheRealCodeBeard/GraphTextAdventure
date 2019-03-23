const Entity = require('../models/entity')
const GameAttributes = require('../models/game-atrributes')

class Player {
  constructor(name, description) {
    // IMPORTANT EVERY ENTITY MUST DO THIS!
    Object.assign(this, new Entity())

    // Common entity fields
    this.label = 'player'    // Pretty damn important
    this.name = name 
    this.description = description    

    // This entity has game attributes
    Object.assign(this, new GameAttributes())    

    // Extra player specific fields
    this.userName = "NOT-USED"
    this.avatar = "https://cdn.iconscout.com/icon/free/png-256/avatar-375-456327.png"
  }
}

module.exports = Player