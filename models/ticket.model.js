const { Schema, model, models } = require('mongoose');

const ticketSetupSchema = new Schema({
    guildId: { type: String, required: true },
    categoryId: { type: String, required: true},
    transcriptChannelId: { type: String, required: true },
    supportRoleId: { type: String, required: true },
    panelChannelId: { type: String, required: true },
    button: [{
        style: { type: String, required: true},
        label: { type: String, required: true},
        emoji: { type: String},
        customId: { type: String, required: true}   
    }],
    embedConfig: {
        title: { type: String, required: true},
        description: { type: String, required: true},
        image: { type: String},
        thumbnail: { type: String},
        footer: { type: String},
    }
});

const activateTicketSchema = new Schema({
    guildId: { type: String, required: true },
    channelId: { type: String, required: true},
    userId: { type: String, required: true },
    ticketId: { type: String, required: true },
    claimed: {
        status: { type: Boolean, default: false},
        by: { type: String }
    },
    closed: { type: Boolean, default: false},
    createdAt: { type: Date, default: Date.now() }
});

const TicketSetup = models.TicketSetup || model('TicketSetup', ticketSetupSchema);
const ActiveTicket = models.ActiveTicket || model('ActiveTicket', activateTicketSchema);

module.exports = {
    TicketSetup,
    ActiveTicket
};