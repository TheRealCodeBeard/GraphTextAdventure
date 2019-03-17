const gremlin = require('gremlin');
const config = require("../../config");

//Picks up the config and creastes the client
const gremlinClient = gremlin.createClient(
    config.port, //usually 443
    config.endpoint, 
    { 
        "session": false, 
        "ssl": true, 
        "user": `/dbs/${config.database}/colls/${config.collection}`,
        "password": config.primaryKey
    }
);

//This function wraps a standard call to cosmos and outputs any errors calling 'next' with query result. 
let gremlin_query = function(query,parameters,next){
    gremlinClient.execute(query,parameters,(err,results)=> {
        if (err)  console.log(`Error: ${err}`);
        else next(results);
    }); 
};

// This function wraps a standard Gremlin call to cosmos with a Promise
let gremlin_query_promise = function(query, parameters) {
    return new Promise(function (resolve, reject) {
        gremlinClient.execute(query, parameters, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

//This returns the current graph as a nodes and edges object
let return_current_graph = function(next){
    gremlin_query("g.V().map(values('id','label','description').fold())",null,(node_results)=>{
        gremlin_query("g.E()",null,(edge_results)=>{
            next({
                nodes:node_results,
                edges:edge_results
            });
        });
    });
};

let get_items_attached_to = function(vectorid,next){
    gremlin_query("g.v('id',vectorid).outE().where(has('label','holds')).inV()",{vectorid:vectorid},next);
};

let get_all_items = function(next){
    gremlin_query("g.v().where(has('label','item'))",null,next);
};

/* to be deleted user player service instead
let get_all_players = function(next){
    gremlin_query("g.v().where(has('label','player'))",null,next);
};
*/

let vector_in = function(vectorid,next){
    gremlin_query("g.v('id',vectorid).outE().where(has('label','in')).inV()",{vectorid:vectorid},next);
};

let get_vector = function(vectorid,next){
    gremlin_query("g.v('id',vectorid)",{vectorid:vectorid},next);
};

let reformat_item_vector = function(item){
    return {
        name:item.properties.name[0].value,
        description:item.properties.description[0].value
    };
};

let reformat_room_vector = function(room){
    return {
        id:room.id,
        type:room.label,
        description:room.properties.description[0].value
    };
};

let reformat_player_vector = function(player){
    return {
        id:player.id,
        name:player.properties.name[0].value
    };
};

let create_npc = function(npc, locationId, next) {
    return gremlin_query_promise(`g.addV('agent').as('x')
        .property('label', 'npc')
        .property('name', name)
        .property('description', shortDesc)
        .property('jsonString', jsonString)
        .addE('in').to( g.V('id', locationId) ).outV()`,
        { 
            locationId: locationId, 
            name: npc.type, 
            jsonString: JSON.stringify(npc),
            shortDesc: npc.shortDesc
        });
};

let get_npcs = function(propFilter, propFilterValue) {
    return gremlin_query_promise(
        `g.v().hasLabel('npc').has(propFilter, propFilterValue)`, 
        { propFilter: propFilter, propFilterValue: propFilterValue }
    )
}

let update_npc = function(id, npc) {
    return gremlin_query_promise(
        `g.v().hasLabel('npc').has('id', id).property('jsonString', jsonString)`, 
        { id: id, jsonString: JSON.stringify(npc) }
    )
}

module.exports = {
    return_current:return_current_graph,
    items_held_by:get_items_attached_to,
    items_all:get_all_items,
    //players_all:get_all_players,
    item_vector_to_object:reformat_item_vector,
    room_vector_to_object:reformat_room_vector,
    get_player_vector:get_vector,//probably useful abstraction for any vectors?
    player_vector_to_object:reformat_player_vector,
    in_room:vector_in,
    query:gremlin_query,

    query_promise: gremlin_query_promise,
    create_npc: create_npc,
    get_npcs: get_npcs,
    update_npc: update_npc
};