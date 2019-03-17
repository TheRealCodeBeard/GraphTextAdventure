const gremlin = require('../../shared/lib/gremlin_wrapper');
const player = require('./player');

let recombobulate = function(vertices){
   return vertices.map((vertext)=>player.hydrate(vertext.id,vertext.properties.name[0].value));
};

let get_all_players = async function(){
    let player_vertices = await gremlin.query_promise("g.v().hasLabel('player')",null);
    return recombobulate(player_vertices);
};

let rename_player = async function(id,name){
    let player_vertices = await gremlin.query_promise("g.v(playerid).property('name',newname)",
                                 {playerid:id,newname:name});
    return recombobulate(player_vertices);
};

module.exports = {
    all:get_all_players,
    rename:rename_player
};