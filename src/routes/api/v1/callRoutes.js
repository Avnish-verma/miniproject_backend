const express = require('express');
const router = express.Router();
const callController = require('../../../controllers/callController');
const { protect } = require('../../../middleware/auth');

router.use(protect);

router.post('/initiate', (req, res, next) => callController.initiateCall(req, res, next));
router.put('/:callId/status', (req, res, next) => callController.updateCallStatus(req, res, next));
router.get('/history', (req, res, next) => callController.getCallHistory(req, res, next));

module.exports = router;
