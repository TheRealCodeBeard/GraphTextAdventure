// Config file loading - MUST be before requiring the Gremlin wrapper(s)
require('dotenv').config({ path: '../.env' })
require('dotenv').config({ path: '.env' })
    
const express = require('express');
const bodyParser = require('body-parser');
require('./consts')

// ---- Common stuff most severs will do ----

// Load config variables
var PORT = process.env.PORT || 4000;
var API_BASE_HOST = process.env.API_BASE_HOST || "http://localhost:3000";

// Set up Express
var app = express();
app.use(bodyParser.json());

// Plug in API routes
let mainRoutes = require('./api-routes/allroutes');
app.use('/', mainRoutes);

// ---- Auto generated Swagger is optional but nice ----

// let swaggerOptions = {
//   swaggerDefinition: {
//     info: {
//       description: 'Graph Text Adventure - NPC API server',
//       title: 'Swagger',
//       version: require('./package.json').version
//     },
//     host: `localhost:${PORT}`,
//     basePath: '/api'
//   },
//   basedir: __dirname,
//   files: ['./api-routes/**/*.js']
// };
// const expressSwagger = require('express-swagger-generator')(app);
// expressSwagger(swaggerOptions);

// ---- get API metadata from base server - NOT USED FOR ANYTHING YET! ----

// require('axios').get(`${API_BASE_HOST}/.well-known/gta-metadata`)
// .then(resp => {
//   exports.METADATA = resp.data
//   console.error(`### Fetched API metadata ${exports.METADATA.version}`);
// })
// .catch(err => {
//   if(err)
//   console.error("### ERROR! Unable to fetch API metadata! Things will not be good");
// });

// ---- NPC service specific code ----

// Export the app so we can use it elsewhere
exports.app = app;
// Start the npcClockLoop 
const clock = require('./lib/clock');
setTimeout(clock.npcClockLoop, CLOCK_MILLS_PER_TICK);

// Load the NPC templates, make them globally accessible / cached
let templateFile = require('path').join(__dirname, NPC_TEMPLATES);
exports.templateStore = JSON.parse(require('fs').readFileSync(templateFile));
console.log(`### Loaded ${Object.keys(exports.templateStore.templates).length} NPC templates into templateStore`);

// ---- Start the server ----

var server = app.listen(PORT, function () {
  console.log(`### NPC API Server listening on ${server.address().port}`);
});

