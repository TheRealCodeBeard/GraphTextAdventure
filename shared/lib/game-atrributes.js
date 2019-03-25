class GameAttributes {
  constructor() {
    this.str = 1    // Strength
    this.phy = 1    // Physical toughness and constitution
    this.cmb = 1    // Combat ability, ranged and melee
    this.agl = 1    // Agility and dexterity 
    this.men = 1    // Mental capability and intelligence 

    this.maxHp = 1  // Starting or maximum hit points
    this.hp    = 1  // Current hit points
    this.arm   = 0  // Defence / armour
    this.gold = 0   // Gold, not used for anything!
  }
}

module.exports = GameAttributes
