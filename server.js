const express = require('express');
const bodyParser = require('body-parser');

const gwr = require("./shared/lib/gremlin_wrapper.js");
const app = express();
const port = 3000;

app.use(express.static('site'))

app.get('/api/current',(req, res) => {
    gwr.return_current((result)=>{
        res.send(result);
    });
});

app.get('/api/items/player/:id',(req,res)=>{
    gwr.items_held_by(req.params.id,(items)=>{
        res.send(items.map(gwr.item_vector_to_object));
    });
});

app.get('/api/items',(req,res)=>{
    gwr.items_all((items)=>{
        res.send(items.map(gwr.item_vector_to_object));
    });
});

app.get('/api/items/room/:id', (req,res)=>{
    gwr.items_held_by(req.params.id,(items)=>{
        res.send(items.map(gwr.item_vector_to_object));
    })
});

app.get('/api/players/:id/room',(req,res)=>{
    gwr.in_room(req.params.id,(rooms)=>{
        res.send(rooms.map(gwr.room_vector_to_object));
    });
});

let careful_convert = function(result){
    let out = null;
    if(result){
        out = {};
        out.id = result.id ? result.id : null;
        out.name = result.properties && result.properties.name ? result.properties.name.map(n=>n.value).join() : null;
        if(!out.name && result.label) out.name = result.label; 
        out.description = result.properties && result.properties.description ? result.properties.description.map(d=>d.value).join() : null;
    }
    return out;
};

let player_look = function(player_guid,next){
    /*
        Attempting look in one query, so in plain language:
            from the player node.edges that hasLabel 'in'.those edges in vertex.those vertexs out edges.where their in vertex are rooms.store in val
            .back to room.deduplicate.store the room in 'val'
            .out edges labeled 'holds'.their in vertexs (which are items).store in val
            .all things in 'val'.unfold to one array deduplicate
    */
    gwr.query(`g.v(pguid).outE().hasLabel('in').inV().outE().where(inV().hasLabel('room')).store('val')
        .outV().dedup().store('val')
        .outE('label','holds').inV().store('val')
        .select('val').unfold().dedup()`,
        {pguid:player_guid},
        (results)=>{
            let out_object = {locations:[],doors:[],items:[],agents:[]};
            results.forEach(result=>{
                if(result.type==='edge' && result.inVLabel==='room' && result.outVLabel==='room') {
                    out_object.doors.push(careful_convert(result));
                } else if (result.type==='vertex' && result.label==='room'){
                    out_object.locations.push(careful_convert(result));
                } else if (result.type==='vertex' && result.label==='item'){
                    out_object.items.push(careful_convert(result));
                } else if (result.type==='vertex' && result.label==='agent'){
                    out_object.agents.push(careful_convert(result));
                } else {
                    console.log(`unexpected result ${JSON.stringify(result)}`);
                }
            });
            next(out_object);
    });
};

app.get('/api/players/:id/look',(req,res)=>{
    player_look(req.params.id,(results)=>{
        res.send(results);
    });
});

app.get('/api/players/:id',(req,res)=>{
    gwr.get_player_vector(req.params.id,(vectors)=>{
        res.send(vectors.map(gwr.player_vector_to_object));
    })
});

app.get('/api/players', (req,res)=>{
    gwr.players_all((players)=>{
        res.send(players.map(gwr.player_vector_to_object));
    });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));