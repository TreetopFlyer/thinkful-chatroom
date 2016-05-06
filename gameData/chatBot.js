var meta = require('./meta');

var chatBot;
chatBot = meta.addMetaToSocket({conn:{id:1}}); // fake 'user' for sending chat messages to everyone
chatBot.chatMeta.alias = 'ChatBot';

module.exports = chatBot;