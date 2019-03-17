const express = require('express');
const bodyParser = require('body-parser');

// Set up Express
var app = express();
app.use(bodyParser.json());

// API routes
let mainRoutes = require('./api-routes/allroutes');
app.use('/', mainRoutes);

// Server port
var port = process.env.PORT || 5000;

// Start the server
var server = app.listen(port, function () {
    console.log(`### Player API Server listening on ${server.address().port}`);
  });