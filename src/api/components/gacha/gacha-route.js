const express = require('express');

const gachaController = require('./gacha-controller');

const route = express.Router();

module.exports = (app) => {
  app.use('/gacha', route);

  route.post('/draw', gachaController.draw);
  route.get('/history/:userId', gachaController.getHistory);
  route.get('/prizes', gachaController.getPrizes);
  route.get('/winners', gachaController.getWinners);
};
