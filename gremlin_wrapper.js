const gremlin = require('gremlin');
const config = require("./config");

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

let query = function(query,parameters,next){
    gremlinClient.execute(query,parameters,(err,results)=> {
        if (err)  error(`Error: ${err}`);
        else next(results);
    }); 
};

let return_current_graph = function(next){
    query("g.V().map(values('id','label','description').fold())",null,(node_results)=>{
        query("g.E()",null,(edge_results)=>{
            next({
                nodes:node_results,
                edges:edge_results
            });
        });
    });
};

module.exports = {
    return_current:return_current_graph
};