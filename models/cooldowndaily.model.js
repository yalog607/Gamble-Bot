const { model, Schema } = require('mongoose');

const dailySchema = new Schema({
    userId: {
        type: String,
        required: true
    },
    cooldownExpiration: {
        type: Number,
        required: true
    }
})

module.exports = model("Daily", dailySchema);