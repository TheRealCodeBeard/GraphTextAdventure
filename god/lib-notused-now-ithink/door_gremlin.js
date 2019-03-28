const gremlin = require('../../shared/lib/gremlin_wrapper');
const door = require('./door');

let recombobulate = function(vertices){
    if(vertices && vertices.length) return vertices.map((vertex)=>door.hydrate(vertex.id,vertex.label));
    else return null;
};

module.exports = {
    recombobulate:recombobulate
};