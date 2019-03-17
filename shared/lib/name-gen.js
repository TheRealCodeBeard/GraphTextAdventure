const fn = require('fantasy-names')


class NameGenerator {

  constructor() {
    this.adjectives = ["sleepy", "bilious", "zealous", "angry", "agitated", "lazy", "shifty", "nervous", "curious", "timid", "ugly", "hairy", "bald", "gnarled", "chubby", "skinny", "gaunt", "fair", "hideous"]
    this.nouns = ["dave", "steve", "kevin", "nigel", "trevor", "simon", "barry", "harry", "norman", "robert", "bob", "ken", "jim", "mike", "ted", "dan"]
  }

  name() {
    return fn('Pathfinder', 'orcs', 1)[0];
    //return this._random(this.adjectives) + ' ' + this._random(this.nouns)
  }

  simpleDesc() {
    return this._random(this.adjectives)
  }

  _random(list) {
    var i = Math.floor(Math.random() * list.length);
    return list[i];
  }
}

module.exports = NameGenerator