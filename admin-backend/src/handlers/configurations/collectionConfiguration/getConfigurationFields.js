const { Configuration } = require('../../../models');

module.exports = async (req, res, next) => {
  const fields = Configuration.getConfigurableFields();

  try {
    res.send({
      fields,
    });
  } catch (e) {
    next(e);
  }
};
