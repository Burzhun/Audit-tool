const { getCurrentStateFields, getCollectionConfiguration } = require('../helpers');

module.exports = async (req, res, next) => {
  try {
    const { name: collectionName } = req.params;
    const { user_type } = req.body;

    const configuration = await getCollectionConfiguration(
      collectionName,
      ['DefaultFieldsToDisplayInAuditSession', 'ComplexFields'],
      user_type
    );

    const currentStateFields = await getCurrentStateFields(collectionName);
    const selected = configuration.DefaultFieldsToDisplayInAuditSession || [];
    let new_fields = selected.filter(f=>typeof f==='string');
    selected.filter(f=>f['name'] && f['DefaultFieldsToDisplayInAuditSession']).forEach(f=>{
      new_fields = new_fields.concat(f['DefaultFieldsToDisplayInAuditSession'].map(f2=>f['name']+'.'+f2));
    });
    selected.filter(f=>f.name && f.nested_fields).forEach(f=>{
      f.nested_fields.forEach(subField=>{
        if(subField.name){
          subField.DefaultFieldsToDisplayInAuditSession.forEach(f3=>{
            new_fields.push(f.name+'.'+subField.name+'.'+f3);
          })
        }else{
          new_fields.push(f.name+'.'+subField);
        }
      })
    })
    const unselected = currentStateFields.filter(
      (item) => !new_fields.includes(item),
    );

    res.send({
      selected,
      unselected,
    });
  } catch (e) {
    next(e);
  }
};
