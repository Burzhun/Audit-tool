const mongoose = require('mongoose');

const UserFunction = new mongoose.Schema({
	collectionName: String,
	field: String,
	name: String,
    code: String,
    updatedField:String,
    comment:String
});
module.exports =  mongoose.model('UserFunction', UserFunction, 'UserFunctions');

