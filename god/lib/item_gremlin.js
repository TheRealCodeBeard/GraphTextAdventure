const gremlin = require('../../shared/lib/gremlin_wrapper');
const item = require('./item');

let recombobulate = function(vertices){
    if(vertices && vertices.length) return vertices.map((vertex)=>item.hydrate(vertex.id,vertex.properties.name.map(d=>d.value).join(),vertex.properties.description.map(d=>d.value).join()));
    else return null;
};

module.exports = {
    recombobulate:recombobulate
};