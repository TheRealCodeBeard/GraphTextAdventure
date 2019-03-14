const express = require('express');
const bodyParser = require('body-parser');

const gwr = require("./gremlin_wrapper.js");
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

app.listen(port, () => console.log(`Example app listening on port ${port}!`));