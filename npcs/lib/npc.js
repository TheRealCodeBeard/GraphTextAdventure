const fs = require('fs')
const NameGenerator = require('../../shared/lib/name-gen')
const Utils = require('../../shared/lib/utils')
const BaseAttributes = require('../../shared/models/base-atrributes')
require('../consts.js')

var templateDB = null

class NPC {
  constructor(type) {
    // Mixin the abstract agent properties with this NPC
    Object.assign( this, new BaseAttributes() )

    this.name = 'Nameless'
    this.type = type
    this.dead = false
    this.shortDesc = ''
  }

  toString() {
    return this.describeShort()
  }

  describeVerbose() {
    let hpPerc = this.hp / this.maxHp
    if(this.dead) return `${this.describeShort()} called '${this.name}' and is dead`
    if(hpPerc <= 0.2) return `${this.describeShort()} named '${this.name}' and looks near death`
    if(hpPerc <= 0.4) return `${this.describeShort()} named '${this.name}' and seems badly hurt`
    if(hpPerc <= 0.6) return `${this.describeShort()} named '${this.name}' and has minor injuries`
    if(hpPerc <= 0.8) return `${this.describeShort()} named '${this.name}' and has a few cuts & bruises`
    if(hpPerc >  0.8) return `${this.describeShort()} named '${this.name}' and looks unharmed`
  }

  describeShort() {
    return `A ${this.shortDesc} ${this.type}`
  }

  takeDamage(dam) {
    if(this.dead) return "They are already dead!"
    let phyBonus = Math.floor(this.phy / 10)
    let actualDam = Math.max(0, dam - this.arm - phyBonus)
    //console.log(`### DEBUG takeDamage: DAM:${dam} - ARM:${this.arm} - PHY:${phyBonus} = ${actualDam}`);
    
    if(actualDam <= 0) {
      return "Your blow has no effect"
    }

    this.hp = this.hp - actualDam
    if(this.hp <= 0) {
      this.kill()
      return `The ${this.type} is slain by your blow!`
    }
    
    return `You strike and damage the ${this.type}`
  } 

  moveTo(locId) {
    return `The ${this.type} leaves ${locId}` 
  }

  kill() {
    this.hp = 0
    this.dead = true
  }

  static create(type) {
    if(!templateDB) templateDB = JSON.parse(fs.readFileSync(NPC_DB))

    let template = templateDB.templates[type]
    if(!template) {
      throw new Error(`Unable to create NPC of type: ${type}`)
    }

    let npc = new this(type)
    npc.str = Utils.parse(template.str)
    npc.phy = Utils.parse(template.phy)
    npc.cmb = Utils.parse(template.cmb)
    npc.agl = Utils.parse(template.agl)
    npc.men = Utils.parse(template.men)

    npc.hp = Utils.parse(template.hp)
    npc.maxHp = npc.hp
    npc.arm = Utils.parse(template.arm)
    npc.gold = Utils.parse(template.gold)

    let ng = new NameGenerator()
    npc.name = ng.name()
    npc.shortDesc = ng.simpleDesc()
    
    return npc
  }

  static hydrateFromGremlin(gremlinRes) {
    return NPC.hydrate(gremlinRes[0].properties.jsonString[0].value)
  }

  static hydrate(jsonString) {
    let data = JSON.parse(jsonString)
    let npc = new this(data.type)
    Object.assign( npc, data )
    return npc
  }
}

module.exports = NPC