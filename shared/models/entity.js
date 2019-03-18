//
// Everything stored and retrieved from Gremlin should have these properties
//

class Entity {
  constructor() {
    this.id = ''            // Gremlin GUID
    this.label = ''         // Gremlin Label. used as type: room, item, npc, player
    this.name = ''          // Name of the thing, e.g. goblin, cheese
    this.description  = ''  // Text description
  }
}

module.exports = Entity
