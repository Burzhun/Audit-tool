const httpErrors = require('http-errors');
const { Configuration } = require('../../../admin_models');
const mongoose = require('mongoose');

module.exports = async (collectionName, configurationFields, user_type='Internal') => {
  const configurations = await Configuration
    .find({
      CollectionRelevantFor: collectionName,
    });
  
  if (!configurations || !configurations.length) {
    throw new httpErrors.NotFound('Configuration for collection not found');
  }

  if(user_type==='external'){
    if(configurations.length>1){
      if(configurations[1].user_type !== user_type){
        if(configurations[0].user_type !== user_type){
          let new_conf = new Configuration(configurations[0]);
          new_conf.user_type = user_type;
          new_conf._id = mongoose.Types.ObjectId();
          new_conf.save();
          return new_conf;
        }else 
          return configurations[0];        
      }else
        return configurations[1];        
    }else{
      let new_conf = new Configuration(configurations[0].toObject());
      new_conf._id = mongoose.Types.ObjectId();
      new_conf.user_type = user_type;
      delete new_conf.__v;
      new_conf.save();
      return new_conf;
    }
  }else{
    return configurations.find(c=>c.user_type===user_type || c.user_type===undefined);
  }
};
