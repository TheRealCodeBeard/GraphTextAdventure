// Config file loading - MUST be before requiring the Gremlin wrapper(s)
require('dotenv').config({ path: '../.env' })
require('dotenv').config({ path: '.env' })
    
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const gwr = require('../shared/lib/gremlin_wrapper');
const app = express();
app.use(cors());
app.use(bodyParser.json());
const port = parseInt(process.env.PORT) || 3000;

// Serve the site
app.use(express.static(`${__dirname}/site`))

app.listen(port, () => console.log(`### Web interface listening on port ${port}!`));