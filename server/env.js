const yaml = require('js-yaml');
const fs   = require('fs');

let env = {};
try {
    env = yaml.load(fs.readFileSync('../config.yaml', 'utf8'));
    if(!process.env.DB_URL){
      if(env.mongo)
        process.env.DB_URL = 'mongodb://'+env.mongo.username+':'+env.mongo.password+env.mongo.host+'/'+env.mongo.database+'?authSource=admin';
      else
        console.error('Mongo url is not set')
      
      if(env.aws){
        process.env.AWS_KEY = env.aws.key
        process.env.AWS_SECRET = env.aws.secret
      }else
        console.error('AWS key is not set')
      
      process.env.PORT = env.port;
      process.env.AUTH_SECRET = env.auth_secret;
      process.env.log_file = env.log_file;
      process.env.FRONTEND_URL = env.frontend_url;
    }
    process.env.log_file = process.env.log_file || 'logs.txt';
    process.env.NODE_ENV = process.env.NODE_ENV || 'development';
  } catch (e) {
    console.error('No config file');
}

module.exports = env;