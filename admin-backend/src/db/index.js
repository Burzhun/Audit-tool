const mongoose = require('mongoose');
const config = require('../config');

module.exports = {
  connection: mongoose.connection,
  connect: async () => mongoose.connect(config.db.uri, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    dbName: config.db.database,
    user: config.db.username,
    pass: config.db.password,
  }),
};
