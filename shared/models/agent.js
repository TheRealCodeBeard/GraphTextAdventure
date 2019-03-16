const Entity = require('./entity')

class Agent {
  constructor(id) {
    // Mixin the abstract entity properties with this Agent
    Object.assign( this, new Entity(`agents`, id) )    
    this.agentType = '' // 'npc' or 'player'

    this.items = []
    this.gold = 0

    this.str = 1
    this.phy = 1
    this.cmb = 1
    this.agl = 1
    this.men = 1

    this.maxHp = 1
    this.hp = 1
    this.arm = 0
  }
}

module.exports = Agent
