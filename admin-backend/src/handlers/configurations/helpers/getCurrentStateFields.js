const { Collection, SchemaOverview } = require('../../../models');

module.exports = async (collectionName) => {
  const Model = Collection(collectionName);

  const scheme = await SchemaOverview
    .findOne({
      collectionName,
    });
  if (scheme && scheme.fields) {
    const fields = scheme.fields.map((f) => f.name).filter((f) => f.includes('CurrentState.')).map((f) => f.replace('CurrentState.', '').replace('.[].', '.'));
    return fields;
  }
  const collectionFields = await Model.aggregate([
    {
      $project: {
        kv: { $objectToArray: '$CurrentState' },
      },
    },
    { $unwind: '$kv' },
    {
      $group: {
        _id: false,
        keys: { $addToSet: '$kv.k' },
      },
    },
  ]);

  return (
    collectionFields &&
    collectionFields.length &&
    collectionFields[0].keys
  ) ? collectionFields[0].keys : [];
};
