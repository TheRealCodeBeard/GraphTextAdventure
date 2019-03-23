//
// ***EVERYTHING*** stored and retrieved from Gremlin as a vertex MUST have these properties
//

class Entity {
  constructor() {
    this.id = ''            // Graph GUID
    this.label = ''         // The graph label of the Vertex, one of: [npc, item, player, room]
    this.name = ''          // Name of the thing, might be "Apple" or for NPC their race/type, e.g. "orc"
    this.description  = ''  // Descriptive text from the point of view of a player
  }
}

module.exports = Entity
