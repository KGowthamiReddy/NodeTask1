//controllers/matchController.js
const fs = require('fs');
const path = require('path');
const Team = require('../models/team');
const Player = require('../models/player');

const calculateBattingPoints = (runs, playerType) => {
  let points = runs; // 1 point per run
  if (runs >= 4) points += 1; // Boundary bonus
  if (runs >= 6) points += 2; // Six bonus
  if (runs >= 30) points += 4; // 30-run bonus
  if (runs >= 50) points += 8; // Half-century bonus
  if (runs >= 100) points += 16; // Century bonus
  if (runs === 0 && ['BAT', 'WK', 'AR'].includes(playerType)) {
    points -= 2; // Dismissal for a duck
  }
  return points;
};

const calculateBowlingPoints = (dismissalInfo) => {
  if (!dismissalInfo) return 0;

  let points = 0;
  if (dismissalInfo.includes('wicket')) {
    points += 25; // Wicket
    if (dismissalInfo === 'bowled' || dismissalInfo === 'lbw') {
      points += 8; // Bonus for LBW / Bowled
    }
  }
  return points;
};

const calculateFieldingPoints = (dismissalInfo) => {
  if (!dismissalInfo) return 0;

  let points = 0;
  if (dismissalInfo.includes('caught')) points += 8; // Catch
  if (dismissalInfo.includes('stumped')) points += 12; // Stumping
  if (dismissalInfo.includes('run out')) points += 6; // Run out
  return points;
};

exports.processMatchResult = async (req, res) => {
  try {
    // Read match result from data/match.json
    const matchResultPath = path.join(__dirname, '../data/match.json');
    const matchResult = JSON.parse(fs.readFileSync(matchResultPath, 'utf8'));

    // Fetch teams from the database
    const teams = await Team.find();

    // Reset team points
    for (const team of teams) {
      team.points = 0;
    }

    // Process each ball in the match result
    for (const ball of matchResult) {
      const { player, runs, dismissalInfo } = ball;

      for (const team of teams) {
        const playerInTeam = team.players.find(p => p.name === player);

        if (playerInTeam) {
          // Calculate points for this player
          const battingPoints = calculateBattingPoints(runs, playerInTeam.type);
          const bowlingPoints = calculateBowlingPoints(dismissalInfo);
          const fieldingPoints = calculateFieldingPoints(dismissalInfo);

          console.log(`Player: ${player}, Batting: ${battingPoints}, Bowling: ${bowlingPoints}, Fielding: ${fieldingPoints}`);

          team.points += battingPoints + bowlingPoints + fieldingPoints;
        }
      }
    }

    // Apply captain and vice-captain multipliers
    for (const team of teams) {
      const captain = team.players.find(p => p.name === team.captain);
      const viceCaptain = team.players.find(p => p.name === team.viceCaptain);

      if (captain) {
        team.points += captain.points; // Add captain's points again for 2x
      }

      if (viceCaptain) {
        team.points += Math.floor(viceCaptain.points * 0.5); // Add half of vice-captain's points for 1.5x
      }

      await team.save();
    }

    res.status(200).json({ message: 'Match result processed successfully' });
  } catch (error) {
    console.error('Error processing match result:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
