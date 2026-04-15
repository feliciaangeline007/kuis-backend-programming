const { GachaLogs, GachaPrizes, Users } = require('../../../models');

async function getUserById(userId) {
  return Users.findById(userId);
}

async function countUserDrawsByDate(userId, drawDate) {
  return GachaLogs.countDocuments({ userId, drawDate });
}

async function listPrizes() {
  return GachaPrizes.find({}).sort({ quota: 1, name: 1 });
}

async function seedPrizes(prizes) {
  return GachaPrizes.insertMany(prizes, { ordered: false });
}

async function incrementWinnerCount(prizeId) {
  return GachaPrizes.findOneAndUpdate(
    {
      _id: prizeId,
      $expr: { $lt: ['$winnerCount', '$quota'] },
    },
    {
      $inc: { winnerCount: 1 },
    },
    {
      new: true,
    }
  );
}

async function createDrawLog(payload) {
  return GachaLogs.create(payload);
}

async function listUserLogs(userId) {
  return GachaLogs.find({ userId }).sort({ createdAt: -1 });
}

async function listWinningLogs() {
  return GachaLogs.find({ isWinner: true }).sort({
    prizeName: 1,
    createdAt: -1,
  });
}

module.exports = {
  getUserById,
  countUserDrawsByDate,
  listPrizes,
  seedPrizes,
  incrementWinnerCount,
  createDrawLog,
  listUserLogs,
  listWinningLogs,
};
