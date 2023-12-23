const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  UserId: {
    type: Number,
    required: true,
  },
  FirstName: {
    type: String,
  },
  LastName: {
    type: String,
  },
  RegisteredDate: {
    type: Date,
    required: true,
  },
  LastSuccessfulLogin: {
    type: String,
  },
  RegisteredUserEmail: {
    type: String,
    required: true,
  },
  Password: {
    type: String,
    required: true,
    select: false,
  },
  role: String,
  PasswordHashed: { type: String, default: '' },
});

module.exports = { User: mongoose.model('User', userSchema, 'User'), model: userSchema };
