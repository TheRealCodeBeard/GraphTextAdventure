// Dotenv handy for local config & debugging
require('dotenv').config({ path: '../.env' })

const express = require('express');
const bodyParser = require('body-parser');
require('../shared/consts')

// Set up Express
var app = express();
app.use(bodyParser.json());


// API routes
let mainRoutes = require('./api-routes/allroutes');
app.use('/', mainRoutes);

// Server port
var port = process.env.PORT || 4000;

// Set up Swagger generator
let swaggerOptions = {
  swaggerDefinition: {
    info: {
      description: 'Graph Text Adventure - NPC API server',
      title: 'Swagger',
      version: require('./package.json').version
    },
    host: `localhost:${port}`,
    basePath: '/api'
  },
  basedir: __dirname,
  files: ['./api-routes/**/*.js']
};
const expressSwagger = require('express-swagger-generator')(app);
expressSwagger(swaggerOptions)

console.log(require('path').join(__dirname, NPC_DB));

// Export the app so we can use it elsewhere, like inside ./lib/clock 
exports.app = app
// Start the npcClockLoop 
const clock = require('./lib/clock')
setTimeout(clock.npcClockLoop, CLOCK_MILLS_PER_TICK);

// Start the server
var server = app.listen(port, function () {
  console.log(`### NPC API Server listening on ${server.address().port}`);
});

