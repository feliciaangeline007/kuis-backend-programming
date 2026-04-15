module.exports = (db) =>
  db.model(
    'GachaPrizes',
    db.Schema(
      {
        code: {
          type: String,
          required: true,
          unique: true,
        },
        name: {
          type: String,
          required: true,
        },
        quota: {
          type: Number,
          required: true,
        },
        winnerCount: {
          type: Number,
          default: 0,
        },
      },
      {
        timestamps: true,
      }
    )
  );
