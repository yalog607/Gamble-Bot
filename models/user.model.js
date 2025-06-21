const {Schema, model} = require('mongoose');

const userSchema = new Schema({
    userId: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
    balance: {
        type: Number,
        required: true,
        min: 0
    }
});

module.exports = model("User", userSchema);