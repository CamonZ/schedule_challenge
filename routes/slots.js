var express = require('express');
var router = express.Router();
var slotsController = require('../controllers/slots_controller');

/* GET /slots/available. */
router.get('/available', slotsController.available);

module.exports = router;
