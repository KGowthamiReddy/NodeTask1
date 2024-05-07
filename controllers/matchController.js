// controllers/matchController.js
const fs = require('fs');
const Team = require('../models/team');
const Player = require('../models/player');

exports.processMatchResult = async (req, res) => {
  try {
    // Read match result from data/match.json
    const matchResult = JSON.parse(fs.readFileSync('./data/match.json', 'utf8'));

    // Iterate through each ball in the match result
    for (const ball of matchResult) {
      // Extract relevant information from the ball
      const { player, runs, dismissalInfo } = ball;

      // Find the player in the database
      const playerInDB = await Player.findOne({ name: player });

      if (playerInDB) {
        // Update points for batting actions
        if (runs >= 0) {
          let battingPoints = runs; // Run
          if (runs >= 4) battingPoints += 1; // Boundary Bonus
          if (runs >= 6) battingPoints += 2; // Six Bonus
          if (runs >= 30) battingPoints += 4; // 30 Run Bonus
          if (runs >= 50) battingPoints += 8; // Half-century Bonus
          if (runs >= 100) battingPoints += 16; // Century Bonus

          // Update points for dismissal for a duck
          if (runs === 0) {
            if (playerInDB.type === 'WK' || playerInDB.type === 'BAT' || playerInDB.type === 'AR') {
              battingPoints -= 2;
            }
          }

          // Find the team containing the player
          const team = await Team.findOne({ 'players.name': playerInDB.name });
          console.log('***** team ****')

          // Update the team's points
          if (team) {
            team.points += battingPoints;
            await team.save();
          }
        }

        // Update points for bowling actions
        if (dismissalInfo && dismissalInfo.includes('wicket')) {
          let bowlingPoints = 25; // Wicket

          // Check for bonus points
          if (dismissalInfo === 'bowled' || dismissalInfo === 'lbw') {
            bowlingPoints += 8; // Bonus (LBW / Bowled)
          }

          // Check for multiple wicket bonus
          const team = await Team.findOne({ 'players.name': playerInDB.name });
          if (team) {
            const bowlersInTeam = team.players.filter(p => p.name !== playerInDB.name && p.type === 'BWL').length;
            if (bowlersInTeam >= 3 && bowlersInTeam < 4) bowlingPoints += 4; // 3 Wicket Bonus
            else if (bowlersInTeam >= 4 && bowlersInTeam < 5) bowlingPoints += 8; // 4 Wicket Bonus
            else if (bowlersInTeam >= 5) bowlingPoints += 16; // 5 Wicket Bonus
          }

          // Update the team's points
          if (team) {
            team.points += bowlingPoints;
            await team.save();
          }
        }

        // Update points for fielding actions
        if (dismissalInfo && (dismissalInfo.includes('caught') || dismissalInfo.includes('stumped') || dismissalInfo.includes('run out'))) {
          let fieldingPoints = 8; // Catch

          // Check for multiple catches bonus
          const team = await Team.findOne({ 'players.name': playerInDB.name });
          if (team) {
            const fieldersInTeam = team.players.filter(p => p.name !== playerInDB.name).length;
            if (fieldersInTeam >= 3) fieldingPoints += 4; // 3 Catch Bonus
          }

          // Update the team's points
          if (team) {
            team.points += fieldingPoints;
            await team.save();
          }
        }
      }
    }

    res.status(200).json({ message: 'Match result processed successfully' });
  } catch (error) {
    console.error('Error processing match result:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
