process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const path = require('path');
const fs = require('fs');

const env = process.env.NODE_ENV;
const envFilePath = path.resolve(process.cwd(), `.env.${env}`);

let options;
if (fs.existsSync(envFilePath)) options = { path: envFilePath };

require('dotenv').config(options);
