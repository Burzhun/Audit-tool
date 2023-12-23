const { Configuration, User } = require('../../../models');
const { getCollectionConfiguration } = require('../helpers');

module.exports = async (req, res, next) => {
  try {
    const { name: collectionName } = req.params;
    const {
      data, field, is_new, is_delete,
    } = req.body;

    // const { name: collectionName } = req.params;
    const configuration = await Configuration
      .findOne({
        CollectionRelevantFor: collectionName,
      });
    if (field === 'Validators') {
      if (data.name && configuration.Validators.find((v) => v.name === data.name)) {
        const index = configuration.Validators.findIndex((v) => v.name === data.name);
        if (is_delete) {
          configuration.Validators = configuration.Validators.slice(0, index).concat(configuration.Validators.slice(index + 1));
        } else { configuration.Validators[index] = data; }
      } else if (is_new) {
        configuration.Validators.push(data);
      }
    }

    await Configuration.updateOne({
      CollectionRelevantFor: collectionName,
    }, { Validators: configuration.Validators });

    res.send({
      data: configuration,
    });
  } catch (e) {
    next(e);
  }
};
