#!node

require('dotenv').config({ path: '.env' })
console.log(process.env);
    
const gremlin = require('../shared/lib/gremlin-wrapper-v2')

if(process.argv.length < 3) {
  console.error("Entity label argument missing, exiting, bye!");
  process.exit(1)
}

console.log("### Deleting ALL entities of given label: "+process.argv[2]);

// Drop all 
gremlin.query("g.V().hasLabel(label).drop()", {label: process.argv[2]})
.then(r => {
  console.log(r)
  process.exit(0)
})
.catch(e => {})
