const express = require('express');
const tenantResolver = require('../middlewares/tenantResolver');
const userController = require('../controllers/userController');

const router = express.Router();

router.use(tenantResolver);

router.post('/report', userController.reportIncident);

module.exports = router;
