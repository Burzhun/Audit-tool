const {
  PORT,
  DB_USERNAME,
  DB_PASSWORD,
  DB_NAME,
  DB_URI,
  NODE_ENV,
} = process.env;

const config = {
  env: NODE_ENV,
  app: {
    port: PORT,
  },
  db: {
    uri: DB_URI,
    username: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_NAME,
  },
};

module.exports = config;
