const router = require('express').Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/authMiddleware');

router.post('/', auth, adminController.createTenant);

module.exports = router;
