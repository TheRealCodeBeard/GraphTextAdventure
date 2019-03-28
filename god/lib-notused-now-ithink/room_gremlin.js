const gremlin = require('../../shared/lib/gremlin_wrapper');
const room = require('../unused/room');
const item_gremlin = require('./item_gremlin');
const door_gremlin = require('./door_gremlin');
const npc_gremlin = require('./npc_gremlin');


let build_description = function(rooms,doors,items,npcs){
    let description = "";
    description += rooms.map(r=>r.description);
    if (doors && doors.length>0) {
        description += `\nYou see ${doors.length} exits(s)`;
        description += `\n\tThere are exist(s) to the ${doors.map(d=>d.name +", ")}`;
    } else {
        description += `\nYou see no exits.`;
    }
    if (items && items.length>0) {
        description += `\nYou see ${items.length} item(s)`;
        description += items.map(i=>"\n\t" + i.name +": " +i.description);
    } else {
        description += `\nYou see no items.`;
    }
    if (npcs && npcs.length>0) {
        description += `\nYou are not alone!`;
        description += npcs.map(n=>"\n\t" + n.name +": " +n.description)
       } else {
        description += `\nNo one else is here.`;
    }
    return description;
};

let build_seen = function(room,doors,items,npcs){
    return {
        description:build_description(room,doors,items,npcs),
        entities:room.concat(doors,items,npcs)
    };
};

let recombobulate = function(vertices){
    if(vertices && vertices.length) return vertices.map((vertex)=>room.hydrate(vertex.id,
        vertex.properties.description?vertex.properties.description.map(d=>d.value).join():"This room is undescribed!"));
    else return null;
};
 
let room_look = async function(id){
    console.log(`\t### Room: ${id}` );
    let rooms = recombobulate(await gremlin.query_promise("g.v(id)",{id:id}));
    let doors = door_gremlin.recombobulate(await gremlin.query_promise("g.v(id).outE().where(inV().hasLabel('room'))",{id:id}));
    let items = item_gremlin.recombobulate(await gremlin.query_promise("g.v(id).outE().hasLabel('holds').inV()",{id:id}));
    let npcs = npc_gremlin.recombobulate(await gremlin.query_promise("g.v(id).inE().hasLabel('in').outV()",{id:id}));
    return build_seen(rooms, doors,items,npcs);
};

let exits = async function(id){
    let rooms = await gremlin.query_promise("g.v(id).outE().where(inV().hasLabel('room')).inV()",{id:id}) 
    return rooms
}

module.exports = {
    recombobulate:recombobulate,
    room_look:room_look,
    exits:exits,
    build_description:build_description
};