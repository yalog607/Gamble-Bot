const { Schema, model } = require('mongoose');

const levelSchema = new Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    xp: {
        type: Number,
    },
    level: {
        type: Number,
        default: 1
    }
})

module.exports = model("Level", levelSchema);