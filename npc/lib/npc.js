const fs = require('fs')
const NameGenerator = require('../../shared/lib/name-gen')
const RPG = require('../../shared/lib/rpg')
const BaseAttributes = require('../../shared/models/base-atrributes')
require('../../shared/consts')

var templateDB = null

class NPC {
  constructor(type) {
    // Mixin the abstract agent properties with this NPC
    Object.assign( this, new BaseAttributes() )

    this.name = 'Nameless'
    this.type = type
    this.dead = false
    this.shortDesc = ''
    
    this.moveChance = 0
  }

  toString() {
    return this.describeShort()
  }

  describeVerbose() {
    let hpPerc = this.hp / this.maxHp
    if(this.dead) return `A dead ${this.describeShort()} who was named '${this.name}'`
    if(hpPerc <= 0.2) return `A ${this.describeShort()} named '${this.name}' and looks near death`
    if(hpPerc <= 0.4) return `A ${this.describeShort()} named '${this.name}' and seems badly hurt`
    if(hpPerc <= 0.6) return `A ${this.describeShort()} named '${this.name}' and has minor injuries`
    if(hpPerc <= 0.8) return `A ${this.describeShort()} named '${this.name}' and has a few cuts & bruises`
    if(hpPerc >  0.8) return `A ${this.describeShort()} named '${this.name}' and looks unharmed`
  }

  describeShort() {
    return `${this.shortDesc} ${this.type}`
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
    let dbPath = require('path').join(__dirname, NPC_DB)
    if(!templateDB) templateDB = JSON.parse(fs.readFileSync(dbPath))

    let template = templateDB.templates[type]
    if(!template) {
      throw new Error(`Unable to create NPC of type: ${type}`)
    }

    let npc = new this(type)
    npc.str = RPG.parseDice(template.str)
    npc.phy = RPG.parseDice(template.phy)
    npc.cmb = RPG.parseDice(template.cmb)
    npc.agl = RPG.parseDice(template.agl)
    npc.men = RPG.parseDice(template.men)

    npc.hp = RPG.parseDice(template.hp)
    npc.maxHp = npc.hp
    npc.arm = RPG.parseDice(template.arm)
    npc.gold = RPG.parseDice(template.gold)

    let ng = new NameGenerator()
    npc.name = ng.name()
    npc.shortDesc = ng.simpleDesc()
    npc.moveChance = template.moveChance
    
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