const { User } = require('../../../models');
const { getCollectionConfiguration } = require('../helpers');

module.exports = async (req, res, next) => {
  try {
    const { name: collectionName } = req.params;

    const configuration = await getCollectionConfiguration(
      collectionName,
      ['Visibility'],
    );

    const users = await User.distinct('RegisteredUserEmail');
    const visible = configuration.Visibility.public;
    const allowedUsers = configuration.Visibility.AllowedUsers;
    const disallowedUsers = users.filter((item) => !allowedUsers.includes(item));

    res.send({
      visible,
      allowedUsers,
      disallowedUsers,
    });
  } catch (e) {
    next(e);
  }
};
