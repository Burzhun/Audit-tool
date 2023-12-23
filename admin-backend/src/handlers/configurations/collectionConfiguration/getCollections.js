const jwt = require('jsonwebtoken');
const { Configuration } = require('../../../models');

module.exports = async (req, res, next) => {
  try {
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
        return res.send({ auth: false, message: 'Failed to authenticate token.' });
      }
      const collections = await Configuration.distinct('CollectionRelevantFor');

      res.send({
        userName: decoded.role === 'Admin' ? decoded.first_name : undefined,
        collections,
      });
    });
  } catch (e) {
    next(e);
  }
};
