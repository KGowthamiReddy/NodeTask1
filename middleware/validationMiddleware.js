// middleware/validationMiddleware.js
const Player = require('../models/player');

exports.validateTeamEntry = async (req, res, next) => {
  try {
    const { name, players, captain, viceCaptain } = req.body;

    // Check if all required fields are present
    if (!name || !players || !captain || !viceCaptain) {
      return res.status(400).json({ error: 'Missing required fields in the request body' });
    }

    // Check if there are exactly 11 players
    if (players.length !== 11) {
      return res.status(400).json({ error: 'A team must have exactly 11 players' });
    }

    // Check if all players exist in the database
    const existingPlayers = await Player.find({ name: { $in: players } });
    const missingPlayers = players.filter(player => !existingPlayers.some(p => p.name === player));
    console.log('==== missingPlayers ====', missingPlayers);
    if (missingPlayers.length > 0) {
      return res.status(400).json({ error: `Players not found: ${missingPlayers.join(', ')}` });
    }

    // Check if captain and vice-captain exist in the list of players
    if (!players.includes(captain)) {
      return res.status(400).json({ error: `Captain '${captain}' not found in the list of players` });
    }
    if (!players.includes(viceCaptain)) {
      return res.status(400).json({ error: `Vice-captain '${viceCaptain}' not found in the list of players` });
    }

    // Check if captain and vice-captain are different players
    if (captain === viceCaptain) {
      return res.status(400).json({ error: 'Captain and vice-captain must be different players' });
    }

    // Proceed to the next middleware if all validation checks pass
    next();
  } catch (error) {
    console.error('Error validating team entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
