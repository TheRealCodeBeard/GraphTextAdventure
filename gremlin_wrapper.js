const gremlin = require('gremlin');
const config = require("./config");

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
        if (err)  error(`Error: ${err}`);
        else next(results);
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
    gremlin_query("g.v('id',vectorid).outE().where(has('label','holds')).inV()",{vectorid:vectorid},results=>next(results));
};

let reformat_item_vector = function(item){
    return {
        name:item.properties.name[0].value,
        description:item.properties.description[0].value
    };
};

module.exports = {
    return_current:return_current_graph,
    items_held_by:get_items_attached_to,
    item_vector_to_object:reformat_item_vector,
    query:gremlin_query
};