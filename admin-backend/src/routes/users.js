const express = require('express');
const {
  getUsers, login,
} = require('../handlers/users');

const router = express.Router();

router.get('/', getUsers);
router.post('/login', login);

module.exports = router;
