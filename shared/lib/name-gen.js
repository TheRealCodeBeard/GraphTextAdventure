const fn = require('fantasy-names')


class NameGenerator {

  constructor() {
    this.adjectives = ["sleepy", "irritable", "zealous", "angry", "agitated", "lazy", "shifty", "nervous", "curious", "timid", "ugly", "hairy", "bald", "gnarled", "chubby", "skinny", "gaunt", "fair", "hideous", "odious", "plain", "drab", "plump", "muscular", "unkempt", "scruffy", "clumsy", "repulsive", "mysterious", "grumpy", "lively", "calm", "fat", "puny", "huge", "swarthy", "bored", "stupid", "tough", "weary", "wide-eyed", "wild", "zany", "arrogant", "depressed", "annoying", "fierce", "cautious", "cruel", "witty", "fabulous", "smart", "handsome", "wicked"]
    
    // Not used
    this.names = ["dave", "steve", "kevin", "nigel", "trevor", "simon", "barry", "harry", "norman", "robert", "bob", "ken", "jim", "mike", "ted", "dan"]
  }

  name() {
    // Using this library https://www.npmjs.com/package/fantasy-names

    return fn('Fantasy', 'Orcs', 1)[0];
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