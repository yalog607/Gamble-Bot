const { model, Schema } = require('mongoose');

const jobSchema = new Schema({
    userId: {
        type: String,
        required: true
    },
    cooldownExpiration: {
        type: Number,
        required: true
    }
})

module.exports = model("Job", jobSchema);