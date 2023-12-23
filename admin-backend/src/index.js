require('./env');

const http = require('http');
const app = require('./app');
const db = require('./db');
const config = require('./config');

const server = http.createServer(app);

async function listenServer() {
  return new Promise((resolve, reject) => {
    server.listen(config.app.port);
    server.on('listening', () => resolve());
    server.on('error', (e) => reject(e));
  });
}

(async () => {
  try {
    console.log(`Application environment: ${config.env}`);

    await db.connect();
    console.log(`MongoDB connected on ${config.db.uri}`);

    await listenServer();
    console.log(`Server listening on port ${config.app.port}`);
  } catch (e) {
    console.error(e);
    db.connection.close();
    server.close();
  }
})();
