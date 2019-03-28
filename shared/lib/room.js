const Entity = require('./entity')

class Room {
  constructor(name, description) {
    // IMPORTANT EVERY ENTITY MUST DO THIS!
    Object.assign(this, new Entity())

    // Common entity fields
    this.label = 'room'    // Pretty damn important
    this.name = name 
    this.description = description

    // Room specific stuff
    this.messages = []
  }

  addMessage(msg) {   
    this.messages.push({
      timestamp: new Date().getTime(),
      text: msg
    })
  }

  getMessagesAfter(timestamp) {
    return this.messages.filter(m => m.timestamp >= timestamp)
  }
}

module.exports = Room