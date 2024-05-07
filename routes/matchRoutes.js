// routes/matchRoutes.js
const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');

router.post('/process-result', matchController.processMatchResult);

module.exports = router;
