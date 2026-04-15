const { env, port } = require('./core/config');
const logger = require('./core/logger')('app');
const server = require('./core/server');
const { connectDatabase } = require('./models');

let app;

async function startServer() {
  try {
    await connectDatabase();

    app = server.listen(port, (err) => {
      if (err) {
        logger.fatal(err, 'Failed to start the server.');
        process.exit(1);
      } else {
        logger.info(`Server runs at port ${port} in ${env} environment`);
      }
    });
  } catch (error) {
    logger.fatal(error, 'Failed to connect to MongoDB.');
    process.exit(1);
  }
}

startServer();

process.on('uncaughtException', (err) => {
  logger.fatal(err, 'Uncaught exception.');

  // Shutdown the server gracefully
  if (app) {
    app.close(() => process.exit(1));
  }

  // If a graceful shutdown is not achieved after 1 second,
  // shut down the process completely
  setTimeout(() => process.abort(), 1000).unref();
  process.exit(1);
});
