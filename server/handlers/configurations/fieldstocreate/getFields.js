const { getCurrentStateFields, getCollectionConfiguration } = require('../helpers');

module.exports = async (req, res, next) => {
  try {
    const { name: collectionName } = req.params;
    const { user_type } = req.body;

    const configuration = await getCollectionConfiguration(
      collectionName,
      ['add_new_record'],
      user_type
    );

    const currentStateFields = await getCurrentStateFields(collectionName);
    let selected=[];
    if(!configuration.add_new_record) configuration.add_new_record = {};
    if(configuration.add_new_record.fields_to_create){
      configuration.add_new_record.fields_to_create.forEach(f=>{
        if(typeof f==='string') selected.push(f);
        else{
          if(f['name']) selected = selected.concat(f['DefaultFieldsToDisplayInAuditSession'].map(subField=>{return f['name']+'.'+subField}))
        }
      })
    }
    const unselected = currentStateFields.filter(
      (item) => !selected.includes(item),
    );
    const on = configuration.add_new_record.on;
    const imageLinks = configuration.add_new_record.ImageLinks;

    res.send({
      unselected,
      selected,
      on,
      imageLinks
    });
  } catch (e) {
    next(e);
  }
};
