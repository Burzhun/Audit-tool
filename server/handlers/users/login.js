const { model } = require('../../admin_models/User');
const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
dotenv.config();

const secret = process.env.AUTH_SECRET;
const saltRounds = 10;

const utils = require('../../routes/utils');



module.exports = function (req, res) {
	const { email, password } = req.body;
	const last_login = new Date().toISOString();
	const userSchema = utils.getUserSchema();
	userSchema.findOne({ RegisteredUserEmail: email }).then(result => {

		if (bcrypt.compareSync(password, result.PasswordHashed)) {
			if(result['role'] === 'new'){
				res.send({
					success: false,	
					status: 'NO_ACCESS'
				});
				return;
			}
			result.updateOne({ LastSuccessfulLogin: last_login }).exec();
			var user = {
				user_id: result.UserId,
				first_name: result.FirstName,
				last_name: result.LastName,
				email: result.RegisteredUserEmail,
				role: result.role
			};

			jwt.sign(
				user,
				secret,
				{
					expiresIn: '7 days'
				},
				(err, token) => {
					res.cookie('token',token,{ expires: new Date(Date.now() + 7*24*3600*1000), httpOnly: true }).json({
						success: true,
						status: 'success',
						token: token
					});
				}
			);
		}
		else {
			res.send({
				success: false,

				status: 'PASSWORD_INCORRECT'
			})
		}

	}).catch(error => {
        console.log(error);
		res.send({
			success: false,
			status: 'USER_NOT_FOUND'
		})
	});

};