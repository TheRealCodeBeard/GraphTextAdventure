class NameGenerator {

  constructor() {
    this.adjectives = ["sleepy", "bilious", "zealous", "angry", "voracious", "cheesy", "torpid", "agitated", "lazy", "shifty", "stabby", "nervous"]
    this.nouns = ["dave", "steve", "kevin", "nigel", "trevor", "simon", "barry", "harry", "norman", "robert", "bob", "ken", "jim", "mike", "ted", "dan"]
  }

  name() {
    return this._random(this.adjectives) + ' ' + this._random(this.nouns)
  }

  _random(list) {
    var i = Math.floor(Math.random() * list.length);
    return list[i];
  }
}

module.exports = NameGenerator