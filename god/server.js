// Config file loading - MUST be before requiring the Gremlin wrapper(s)
require('dotenv').config({ path: '../.env' })
require('dotenv').config({ path: '.env' })

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Set up Express
var app = express();
app.use(cors());
app.use(bodyParser.json());

// API routes
let mainRoutes = require('./api-routes/allroutes');
app.use('/', mainRoutes);

// Server port
var port = process.env.PORT || 7000;

// Start the server
var server = app.listen(port, function () {
    console.log(`### God API Server listening on ${server.address().port}`);
  });