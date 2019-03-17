const gremlin = require('../../shared/lib/gremlin_wrapper');
const npc = require('./npc');

let recombobulate = function(vertices){
    if(vertices && vertices.length) return vertices.filter(v=>v.label!='player').map((v)=>npc.hydrate(v.id,
        v.properties.name.map(n=>n.value).join(),
        v.properties.description.map(d=>d.value).join())
        );
    else return null;
};

module.exports = {
    recombobulate:recombobulate
};