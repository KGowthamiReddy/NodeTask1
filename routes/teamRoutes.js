// routes/teamRoutes.js
const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const validationMiddleware = require('../middleware/validationMiddleware')

router.post('/add-team', validationMiddleware.validateTeamEntry, teamController.addTeam);
router.get('/team-result', teamController.viewTeamResults);

module.exports = router;
