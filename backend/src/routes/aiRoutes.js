const express = require('express');
const tenantResolver = require('../middlewares/tenantResolver');
const aiController = require('../controllers/aiController');

const router = express.Router();

router.use(tenantResolver);

router.post('/detect', aiController.receiveDetection);

module.exports = router;
