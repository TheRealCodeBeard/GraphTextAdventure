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

app.listen(port, () => console.log(`Example app listening on port ${port}!`));