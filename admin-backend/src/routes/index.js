const express = require('express');
const configurations = require('./configurations');
const users = require('./users');

const router = express.Router();

router.use('/configurations', configurations);
router.use('/users', users);

module.exports = router;
