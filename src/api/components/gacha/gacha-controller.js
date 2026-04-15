const mongoose = require('mongoose');

const gachaService = require('./gacha-service');
const { errorResponder, errorTypes } = require('../../../core/errors');

function validateObjectId(value, fieldName) {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw errorResponder(
      errorTypes.VALIDATION,
      `${fieldName} must be a valid MongoDB ObjectId`
    );
  }
}

async function draw(request, response, next) {
  try {
    const { user_id: userId } = request.body;

    if (!userId) {
      throw errorResponder(errorTypes.VALIDATION, 'user_id is required');
    }

    validateObjectId(userId, 'user_id');

    const result = await gachaService.draw(userId);

    return response.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

async function getHistory(request, response, next) {
  try {
    validateObjectId(request.params.userId, 'userId');

    const result = await gachaService.getHistory(request.params.userId);

    return response.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

async function getPrizes(request, response, next) {
  try {
    const result = await gachaService.getPrizeSummaries();

    return response.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

async function getWinners(request, response, next) {
  try {
    const result = await gachaService.getWinners();

    return response.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  draw,
  getHistory,
  getPrizes,
  getWinners,
};
