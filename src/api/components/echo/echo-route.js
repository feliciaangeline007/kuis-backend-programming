const express = require('express');

const echoController = require('./echo-controller');

const route = express.Router();

module.exports = (app) => {
  app.use('/echo', route);

  route.get('/', echoController.echo);
  route.post('/', echoController.echo);
};
