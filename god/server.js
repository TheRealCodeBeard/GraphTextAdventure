// Config file loading - MUST be before requiring the Gremlin wrapper(s)
require('dotenv').config({ path: '../.env' })
require('dotenv').config({ path: '.env' })

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
var morgan = require('morgan')

// Set up Express
var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'))

// API routes
let itemRoutes = require('./api-routes/items');
let roomRoutes = require('./api-routes/rooms');
let worldRoutes = require('./api-routes/world');
let entityRoutes = require('./api-routes/entities');
app.use('/', itemRoutes);
app.use('/', roomRoutes);
app.use('/', worldRoutes);
app.use('/', entityRoutes);

// Server port
var port = process.env.PORT || 5000;

// Start the server
var server = app.listen(port, function () {
  console.log(`### God API Server listening on ${server.address().port}`);
});