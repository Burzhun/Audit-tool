const { Configuration, User } = require('../../../models');
const { getCollectionConfiguration } = require('../helpers');

module.exports = async (req, res, next) => {
  try {
    const { name: collectionName } = req.params;
    const { visible, allowedUsers } = req.body;

    await getCollectionConfiguration(
      collectionName,
      ['_id'],
    );

    const update = {
      'Visibility.public': visible,
    };

    if (!visible) {
      const users = await User.distinct('RegisteredUserEmail');
      update['Visibility.AllowedUsers'] = allowedUsers
        .filter((item) => users.includes(item));
    }

    await Configuration.updateOne({
      CollectionRelevantFor: collectionName,
    }, update);

    res.send();
  } catch (e) {
    next(e);
  }
};
