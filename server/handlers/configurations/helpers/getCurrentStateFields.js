const { Collection, SchemaOverview } = require('../../../admin_models');

module.exports = async (collectionName) => {
  const Model = Collection(collectionName);

  const scheme = await SchemaOverview
    .findOne({
        collectionName: collectionName,
    }); 
  if(scheme && scheme.fields){
    const fields = scheme.fields.filter(f=>f['types'][0].type!=='object' && !f.name.includes('AuditSessions')).map(f=>f.name).map(f=>f.replace('CurrentState.','').replace('AuditState.','').replace(/\.\[\]/g,'')).filter(f=>f!=='AuditNumber');
    return [...new Set(fields.filter(f=>f!=='' && f!=='_id'))];
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
