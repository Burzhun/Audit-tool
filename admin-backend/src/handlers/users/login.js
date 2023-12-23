const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { model } = require('../../models/User');

dotenv.config();

const secret = process.env.AUTH_SECRET;
const saltRounds = 10;

const getUserSchema = function () {
  const db = mongoose.connection;
  autoIncrement.initialize(db);
  model.plugin(autoIncrement.plugin, {
    model: 'User', field: 'UserId', startAt: 10, incrementBy: 1,
  });
  return mongoose.model('User', model, 'User');
};

module.exports = function (req, res) {
  console.log(req.body);
  const { email, password } = req.body;
  const last_login = new Date().toISOString();
  const userSchema = getUserSchema();
  userSchema.findOne({ RegisteredUserEmail: email }).then((result) => {
    if (bcrypt.compareSync(password, result.PasswordHashed)) {
      if (result.role === 'new') {
        res.send({
          success: false,
          status: 'NO_ACCESS',
        });
        return;
      }
      result.updateOne({ LastSuccessfulLogin: last_login }).exec();
      const user = {
        user_id: result.UserId,
        first_name: result.FirstName,
        last_name: result.LastName,
        email: result.RegisteredUserEmail,
        role: result.role,
      };

      jwt.sign(
        user,
        secret,
        {
          expiresIn: '7 days',
        },
        (err, token) => {
          res.cookie('token', token, { expires: new Date(Date.now() + 7 * 24 * 3600 * 1000), httpOnly: true }).json({
            success: true,
            status: 'success',
            token,
          });
        },
      );
    } else {
      res.send({
        success: false,

        status: 'PASSWORD_INCORRECT',
      });
    }
  }).catch((error) => {
    console.log(error);
    res.send({
      success: false,
      status: 'USER_NOT_FOUND',
    });
  });
};
