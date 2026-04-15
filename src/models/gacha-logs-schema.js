module.exports = (db) =>
  db.model(
    'GachaLogs',
    db.Schema(
      {
        userId: {
          type: db.Schema.Types.ObjectId,
          ref: 'Users',
          required: true,
        },
        userFullName: {
          type: String,
          required: true,
        },
        drawDate: {
          type: String,
          required: true,
        },
        isWinner: {
          type: Boolean,
          required: true,
        },
        prizeId: {
          type: db.Schema.Types.ObjectId,
          ref: 'GachaPrizes',
          default: null,
        },
        prizeName: {
          type: String,
          default: null,
        },
      },
      {
        timestamps: true,
      }
    )
  );
