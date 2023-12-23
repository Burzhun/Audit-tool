const copyRecord = require('./copyRecord');
const {showLog} = require('./showLog');
const addRecord = require('./addRecords');
const {fetchDatabase, fetchImage, saveDatabase, getRecord, uploadFile,removeFile, saveFunction} = require('./database');
const {fetchConfig,  getConfigs, setUserConfig} = require('./configs');
const {globalUpdate, globalUpdateAll} = require('./globalUpdate');

const index = function(req, res) {
	res.render('index', { title: 'Product List Admin Panel' });
};

module.exports = {
	index, copyRecord, fetchConfig, fetchDatabase, fetchImage,
	saveDatabase, getConfigs, getRecord, uploadFile, addRecord,removeFile, globalUpdate, globalUpdateAll,
	showLog,saveFunction,setUserConfig
};
