const { Configuration } = require('../../../admin_models');

module.exports = async (req, res, next) => {
  const user_type = req.body.user_type || 'Internal';
  const fields = Configuration.getConfigurableFields(user_type);

  try {
    res.send({
      fields,
    });
  } catch (e) {
    next(e);
  }
};
