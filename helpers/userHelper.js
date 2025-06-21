const User = require('../models/user.model');

async function decBalance(userId, amount) {
    try {
        const user = await User.findOne({ userId: userId });
        if (user) {
            if (user.balance < amount) {
                user.balance = 0;
                await user.save();
                return true;
            }
            user.balance -= amount;
            await user.save();
            return true;
        }
        return false;
    } catch (error) {
        console.error("Error decrementing balance for user", userId, ":", error);
        return false;
    }
}

async function incBalance(userId, amount) {
    try {
        const user = await User.findOne({ userId: userId });
        if (user) {
            user.balance += amount;
            await user.save();
            return true;
        }
        return false;
    } catch (error) {
        console.error("Error incrementing balance for user", userId, ":", error);
        return false;
    }
}

module.exports = {
    decBalance,
    incBalance
}