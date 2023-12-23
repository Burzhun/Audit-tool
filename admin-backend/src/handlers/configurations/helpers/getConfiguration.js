const httpErrors = require('http-errors');
const jwt = require('jsonwebtoken');
const { Configuration, SchemaOverview } = require('../../../models');

module.exports = async (req, res, next) => {
  const { name: collectionName } = req.params;
  let token = req.headers['x-access-token'];
  const secret = process.env.AUTH_SECRET;
  if (token && token.startsWith('Bearer ')) {
    // Remove Bearer from string
    token = token.replace('Bearer ', '');
  }

  if (!token || token === undefined) {
    if (req.headers.cookie) {
      token = req.headers.cookie.split('; ').filter((item) => item.startsWith('token'))[0];

      if (token) {
        // Remove Bearer from string
        token = token.replace('token=', '');
      }
    }
  }
  if (!token) {
    return res.send({ auth: false, message: 'No token provided.' });
  }
  jwt.verify(token, secret, async (err, decoded) => {
    if (err) {
      console.log(err);
      return res.send({ auth: false, message: 'Failed to authenticate token.' });
    }

    // req.userId = decoded.user_id;

    const configuration = await Configuration
      .findOne({
        CollectionRelevantFor: collectionName,
      });

    const scheme = await SchemaOverview
      .findOne({
        collectionName,
      });

    if (!configuration) {
      throw new httpErrors.NotFound('Configuration for collection not found');
    }

    res.send({
      data: configuration,
      scheme,
      role: decoded.role,
      username: decoded.first_name,
    });
  });
};
