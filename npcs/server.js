// Dotenv handy for local config & debugging
require('dotenv').config()

const express = require('express');
const bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.json());

let mainRoutes = require('./api-routes/allroutes');
app.use('/', mainRoutes);

var port = process.env.PORT || 4000;

let swaggerOptions = {
  swaggerDefinition: {
    info: {
      description: 'MUD-graph agent API server',
      title: 'Swagger',
      version: '1.0.0',
    },
    host: `localhost:${port}`,
    basePath: '/api'
  },
  basedir: __dirname, //app absolute path
  files: ['./api-routes/**/*.js'] //Path to the API handle folder
};
const expressSwagger = require('express-swagger-generator')(app);
expressSwagger(swaggerOptions)

var server = app.listen(port, function () {
  console.log(`### Server listening on ${server.address().port}`);
});

