const router = require('express').Router();
const incidentController = require('../controllers/incidentController');
const auth = require('../middleware/authMiddleware');
const tenantResolver = require('../middleware/tenantResolver');

router.use(auth, tenantResolver);
router.get('/', incidentController.list);
router.post('/', incidentController.create);
router.put('/:id', incidentController.update);
router.delete('/:id', incidentController.remove);

module.exports = router;
