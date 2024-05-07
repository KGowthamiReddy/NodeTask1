// controllers/teamController.js
const Team = require('../models/team');
const Player = require('../models/player');

exports.addTeam = async (req, res) => {
  try {
    const { name, players, captain, viceCaptain } = req.body;

    // Check if the team name already exists
    const existingTeam = await Team.findOne({ name });
    if (existingTeam) {
      return res.status(400).json({ error: 'Team with the same name already exists' });
    }

    // Validate the number of players
    if (players.length !== 11) {
      return res.status(400).json({ error: 'A team must have exactly 11 players' });
    }

    // Validate the number of players from each category
    const playerCounts = { WK: 0, BAT: 0, AR: 0, BWL: 0 };
    for (const playerName of players) {
      const player = await Player.findOne({ name: playerName });
      if (!player) {
        return res.status(400).json({ error: `Player '${playerName}' not found` });
      }
      playerCounts[player.type]++;
    }
    if (playerCounts.WK < 1 || playerCounts.BAT < 1 || playerCounts.AR < 1 || playerCounts.BWL < 1) {
      return res.status(400).json({ error: 'A team must have at least one player of each type' });
    }

    // Validate captain and vice-captain
    const captainPlayer = await Player.findOne({ name: captain });
    if (!captainPlayer) {
      return res.status(400).json({ error: `Captain '${captain}' not found` });
    }
    const viceCaptainPlayer = await Player.findOne({ name: viceCaptain });
    if (!viceCaptainPlayer) {
      return res.status(400).json({ error: `Vice-captain '${viceCaptain}' not found` });
    }

    // Create the team
    const team = new Team({
      name,
      players: players.map(playerName => ({ name: playerName })),
      captain: captainPlayer._id,
      viceCaptain: viceCaptainPlayer._id,
    });
    await team.save();

    res.status(201).json({ message: 'Team created successfully', team });
  } catch (error) {
    console.error('Error adding team:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.viewTeamResults = async (req, res) => {
  try {
    // Fetch all teams and their points
    const teams = await Team.find({}, { name: 1, points: 1 }).sort({ points: -1 });

    // Determine the winning team(s)
    const maxPoints = teams.length > 0 ? teams[0].points : 0;
    const winningTeams = teams.filter(team => team.points === maxPoints);

    res.status(200).json({ winningTeams });
  } catch (error) {
    console.error('Error viewing team results:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
