const express = require('express');

const books = require('./components/books/books-route');
const echo = require('./components/echo/echo-route');
const gacha = require('./components/gacha/gacha-route');
const users = require('./components/users/users-route');

module.exports = () => {
  const app = express.Router();

  books(app);
  echo(app);
  gacha(app);
  users(app);

  return app;
};
