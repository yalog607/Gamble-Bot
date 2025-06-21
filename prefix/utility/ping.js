
module.exports = {
    name: 'ping',
    description: "Reply with pong!",
    run: (client, message, args) => {
        message.channel.send(`🌾🌾 **Pongg: ${client.ws.ping}ms** <:10s:1383700047488745532>`);
    }
}