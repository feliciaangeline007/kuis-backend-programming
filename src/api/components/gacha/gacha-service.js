const gachaRepository = require('./gacha-repository');
const { errorResponder, errorTypes } = require('../../../core/errors');

const DAILY_DRAW_LIMIT = 5;

const DEFAULT_PRIZES = [
  { code: 'gold-10g', name: 'Emas 10 gram', quota: 1 },
  { code: 'smartphone-x', name: 'Smartphone X', quota: 5 },
  { code: 'smartwatch-y', name: 'Smartwatch Y', quota: 10 },
  { code: 'voucher-100k', name: 'Voucher Rp100.000', quota: 100 },
  { code: 'pulsa-50k', name: 'Pulsa Rp50.000', quota: 500 },
];

const MISS_WEIGHT = 3000;

function getDrawDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
  }).format(new Date());
}

function maskName(fullName) {
  return fullName
    .split(' ')
    .map((word) => {
      if (word.length <= 2) {
        return `${word[0]}*`;
      }

      const firstChar = word[0];
      const lastChar = word[word.length - 1];

      const middle = word
        .slice(1, -1)
        .split('')
        .map((char) => (Math.random() < 0.5 ? '*' : char))
        .join('');

      return firstChar + middle + lastChar;
    })
    .join(' ');
}

function chooseDrawResult(availablePrizes) {
  const entries = availablePrizes.map((prize) => ({
    type: 'prize',
    prize,
    weight: prize.quota,
  }));

  entries.push({
    type: 'miss',
    prize: null,
    weight: MISS_WEIGHT,
  });

  const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
  const threshold = Math.random() * totalWeight;

  let cumulativeWeight = 0;

  return (
    entries.find((entry) => {
      cumulativeWeight += entry.weight;
      return cumulativeWeight >= threshold;
    }) || entries[entries.length - 1]
  );
}

async function getOrCreatePrizes() {
  const existingPrizes = await gachaRepository.listPrizes();

  if (existingPrizes.length > 0) {
    return existingPrizes;
  }

  try {
    await gachaRepository.seedPrizes(DEFAULT_PRIZES);
  } catch (error) {
    // ignore duplicate insert
  }

  return gachaRepository.listPrizes();
}

async function reservePrize(prizes, remainingAttempts = 5) {
  if (remainingAttempts <= 0 || prizes.length === 0) {
    return null;
  }

  const selectedResult = chooseDrawResult(prizes);

  if (selectedResult.type === 'miss') {
    return null;
  }

  const reservedPrize = await gachaRepository.incrementWinnerCount(
    selectedResult.prize.id
  );

  if (reservedPrize) {
    return reservedPrize;
  }

  return reservePrize(prizes, remainingAttempts - 1);
}

function formatDrawResponse({
  user,
  drawDate,
  drawCountToday,
  winningPrize,
  log,
}) {
  return {
    user: {
      id: user.id,
      fullName: user.fullName,
    },
    drawDate,
    drawCountToday,
    remainingDrawsToday: DAILY_DRAW_LIMIT - drawCountToday,
    result: winningPrize
      ? {
          isWinner: true,
          prize: {
            id: winningPrize.id,
            name: winningPrize.name,
          },
          message: `Selamat, anda memenangkan ${winningPrize.name}`,
        }
      : {
          isWinner: false,
          prize: null,
          message: 'Maaf, anda belum mendapatkan hadiah',
        },
    logId: log.id,
  };
}

async function getUserOrThrow(userId) {
  const user = await gachaRepository.getUserById(userId);

  if (!user) {
    throw errorResponder(errorTypes.UNPROCESSABLE_ENTITY, 'User not found');
  }

  return user;
}

async function draw(userId) {
  const user = await getUserOrThrow(userId);
  const drawDate = getDrawDate();

  const todayDrawCount = await gachaRepository.countUserDrawsByDate(
    userId,
    drawDate
  );

  if (todayDrawCount >= DAILY_DRAW_LIMIT) {
    throw errorResponder(errorTypes.BAD_REQUEST, 'Daily gacha limit reached');
  }

  const prizes = await getOrCreatePrizes();

  const availablePrizes = prizes.filter(
    (prize) => prize.winnerCount < prize.quota
  );

  const winningPrize = await reservePrize(availablePrizes);

  const drawCountToday = todayDrawCount + 1;

  const log = await gachaRepository.createDrawLog({
    userId: user.id,
    userFullName: user.fullName,
    drawDate,
    isWinner: !!winningPrize,
    prizeId: winningPrize ? winningPrize.id : null,
    prizeName: winningPrize ? winningPrize.name : null,
  });

  return formatDrawResponse({
    user,
    drawDate,
    drawCountToday,
    winningPrize,
    log,
  });
}

async function getHistory(userId) {
  const user = await getUserOrThrow(userId);
  const logs = await gachaRepository.listUserLogs(userId);

  return {
    user: {
      id: user.id,
      fullName: user.fullName, // (opsional: bisa dimask kalau mau)
    },
    totalDraws: logs.length,
    history: logs.map((log) => ({
      id: log.id,
      drawDate: log.drawDate,
      isWinner: log.isWinner,
      prizeName: log.prizeName,
      createdAt: log.createdAt,
    })),
  };
}

async function getWinners() {
  const prizes = await getOrCreatePrizes();
  const winningLogs = await gachaRepository.listWinningLogs();

  const winnersByPrizeName = winningLogs.reduce((result, log) => {
    const { prizeName } = log;
    const existing = result[prizeName] || [];

    return {
      ...result,
      [prizeName]: [
        ...existing,
        {
          userId: log.userId,
          maskedName: maskName(log.userFullName),
          wonAt: log.createdAt,
        },
      ],
    };
  }, {});

  return prizes.map((prize) => ({
    prizeName: prize.name,
    totalWinners: (winnersByPrizeName[prize.name] || []).length,
    winners: winnersByPrizeName[prize.name] || [],
  }));
}

async function getPrizeSummaries() {
  const prizes = await getOrCreatePrizes();

  return prizes.map((prize) => ({
    id: prize.id,
    code: prize.code,
    name: prize.name,
    quota: prize.quota,
    winnerCount: prize.winnerCount,
    remainingQuota: Math.max(prize.quota - prize.winnerCount, 0),
  }));
}

module.exports = {
  draw,
  getHistory,
  getPrizeSummaries,
  getWinners,
};
