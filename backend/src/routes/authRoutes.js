const express = require('express');
const tenantResolver = require('../middlewares/tenantResolver');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/login', tenantResolver, authController.login);

module.exports = router;
