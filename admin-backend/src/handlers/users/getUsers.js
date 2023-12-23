const { User } = require('../../models');

module.exports = async (req, res, next) => {
  try {
    const users = await User.distinct('RegisteredUserEmail');
    res.send({
      users,
    });
  } catch (e) {
    next(e);
  }
};
