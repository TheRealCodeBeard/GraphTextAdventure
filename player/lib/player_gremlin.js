const gremlin = require('../../shared/lib/gremlin_wrapper');
const player = require('./player');

let get_all_players = async function(){
    let player_vertices = await gremlin.query_promise("g.v().hasLabel('player')",null);
    return player_vertices.map((player_vertext)=>player.hydrate(player_vertext.id,player_vertext.properties.name[0].value));
};

module.exports = {
    all:get_all_players
};