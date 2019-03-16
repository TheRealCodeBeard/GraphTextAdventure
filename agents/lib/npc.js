const fs = require('fs')
const NameGenerator = require('../../shared/lib/name-gen')
const Utils = require('../../shared/lib/utils')
const Agent = require('../../shared/models/agent')
require('../consts.js')

var npcDB = null

class NPC {
  constructor(type) {
    // Mixin the abstract agent properties with this NPC
    let id = require('uuid/v4')()
    Object.assign( this, new Agent(id) )

    this.name = "Nameless"
    this.agentType = 'npc'
    this.subType = type
    this.dead = false
  }

  toString() {
    return `${this.subType} (${this.name})`
  }

  describe() {
    let hpPerc = this.hp / this.maxHp
    if(this.dead) return `The ${this.subType} was called '${this.name}' and is dead`
    if(hpPerc <= 0.2) return `The ${this.subType} is named '${this.name}' and looks near death`
    if(hpPerc <= 0.4) return `The ${this.subType} is named '${this.name}' and seems badly hurt`
    if(hpPerc <= 0.6) return `The ${this.subType} is named '${this.name}' and has minor injuries`
    if(hpPerc <= 0.8) return `The ${this.subType} is named '${this.name}' and has a few cuts & bruises`
    if(hpPerc >  0.8) return `The ${this.subType} is named '${this.name}' and looks unharmed`
  }

  takeDamage(dam) {
    if(this.dead) return "The monster is already dead!"
    let phyBonus = Math.floor(this.phy / 10)
    let actualDam = Math.max(0, dam - this.arm - phyBonus)
    //console.log(`### DEBUG takeDamage: DAM:${dam} - ARM:${this.arm} - PHY:${phyBonus} = ${actualDam}`);
    
    if(actualDam <= 0) {
      return "Your blow has no effect"
    }

    this.hp = this.hp - actualDam
    if(this.hp <= 0) {
      this.kill()
      return `The ${this.subType} is slain by your blow!`
    }
    
    return `You strike and damage the ${this.subType}`
  } 

  moveTo(locId) {
    return `The ${this.subType} leaves ${locId}` 
  }

  kill() {
    this.hp = 0
    this.dead = true
  }

  static create(type) {
    if(!npcDB) npcDB = JSON.parse(fs.readFileSync(NPC_DB))

    let template = npcDB.templates[type]
    if(!template) {
      throw new Error(`Unable to create NPC of type: ${type}`)
    }

    let m = new this(type)
    m.str = Utils.parse(template.str)
    m.phy = Utils.parse(template.phy)
    m.cmb = Utils.parse(template.cmb)
    m.agl = Utils.parse(template.agl)
    m.men = Utils.parse(template.men)

    m.hp = Utils.parse(template.hp)
    m.maxHp = m.hp
    m.arm = Utils.parse(template.arm)
    m.gold = Utils.parse(template.gold)

    m.name = new NameGenerator().name()
    return m
  }

}

module.exports = NPC