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
    })
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