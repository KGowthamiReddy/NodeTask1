// models/Player.js
const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['WK', 'BAT', 'AR', 'BWL'], required: true },
});

module.exports = mongoose.model('Player', playerSchema);
