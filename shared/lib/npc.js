const NameGenerator = require('./name-gen')
const RPG = require('./rpg')
const GameAttributes = require('./game-atrributes')
const Entity = require('./entity')
const Utils = require('./utils')
const Server = require('../../npc/server')
require('../consts')

module.exports = class NPC {
  constructor(type) {
    // IMPORTANT EVERY ENTITY MUST DO THIS!
    Object.assign(this, new Entity())

    // Common entity fields
    this.label = 'npc'    // Pretty damn important
    this.name = type      // Slightly confusing, we store type in the name field
    this.description = '' // Update this later

    let template = Server.templateStore.templates[type]
    if(!template) {
      throw new Error(`Unable to create NPC of type: ${type}`)
    }

    // This entity has game attributes
    Object.assign(this, new GameAttributes())
    this.str = RPG.parseDice(template.str)
    this.phy = RPG.parseDice(template.phy)
    this.cmb = RPG.parseDice(template.cmb)
    this.agl = RPG.parseDice(template.agl)
    this.men = RPG.parseDice(template.men)
    this.hp = RPG.parseDice(template.hp)
    this.maxHp = this.hp
    this.def = RPG.parseDice(template.def)
    this.gold = RPG.parseDice(template.gold)
    
    // NPC specific fields
    let nameGen = new NameGenerator()
    this.moveChance = template.moveChance
    this.npcName = nameGen.name()
    this.npcDesc = nameGen.simpleDesc()
    this.dead = false

    this.updateDescription()
  }

  //
  // For debugging
  //
  toString() {
    return `${this.npcDesc} ${this.npcName}`
  }

  //
  // Update the description based on name and health
  //
  updateDescription() {
    let hpPerc = this.hp / this.maxHp
    if(this.dead) {
      this.description = `A dead ${this.npcDesc} ${this.name} who was called '${this.npcName}'`
      return
    }
    if(hpPerc <= 0.2) { this.description = `A ${this.npcDesc} ${this.name}, called '${this.npcName}'. They look near death`; return }
    if(hpPerc <= 0.4) { this.description = `A ${this.npcDesc} ${this.name}, called '${this.npcName}'. They seem badly hurt`; return }
    if(hpPerc <= 0.6) { this.description = `A ${this.npcDesc} ${this.name}, called '${this.npcName}'. They have minor injuries`; return }
    if(hpPerc <= 0.8) { this.description = `A ${this.npcDesc} ${this.name}, called '${this.npcName}'. They have a few cuts & bruises`; return; }
    if(hpPerc >  0.8) { this.description = `A ${this.npcDesc} ${this.name}, called '${this.npcName}'. They appear unharmed`; return }
  }

  //
  // Try to damage this NPC, it might not have any effect
  //
  takeDamage(dam) {
    if(this.dead) return "They are already dead!"
    let phyBonus = Math.floor(this.phy / 10)
    let actualDam = Math.max(0, dam - this.def - phyBonus)
    console.log(`### DEBUG takeDamage: DAM:${dam} - DEF:${this.def} - PHY:${phyBonus} = ${actualDam}`);
    
    if(actualDam <= 0) {
      return "Your blow has no effect"
    }

    this.hp = this.hp - actualDam
    if(this.hp <= 0) {
      this.kill()
      return `The ${this.name} is slain by your blow!`
    }
    
    this.updateDescription()
    
    return `You strike and damage the ${this.name}`
  } 

  //
  // Rest in peace 
  //
  kill() {
    this.hp = 0
    this.dead = true
    this.updateDescription()
  }
}