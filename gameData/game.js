var fishbowl = require('./fishbowl');

exports.drawer = undefined;
exports.words = undefined;
exports.guesses = 0;
exports.guessesPerUser = 3;

exports.getState = function(){
    return {
        drawer:exports.drawer.chatMeta,
        words:exports.words
    };
};

exports.startRound = function(inDrawer){
    
    if(exports.drawer){
        exports.drawer.chatMeta.drawing = false;
    }
    
    exports.guesses = 0;
    exports.words = fishbowl(15);
    exports.drawer = inDrawer;
    exports.drawer.chatMeta.drawing = true;
    exports.drawer.emit('state-drawing', exports.getState());
    exports.drawer.broadcast.emit('state-guessing', exports.getState());
};

exports.addGuesser = function(inGuesser){
    inGuesser.emit('state-guessing', exports.getState());
};

exports.randomStart = function(inRegistered){
    exports.startRound(inRegistered[Math.floor(inRegistered.length*Math.random())]);
};

exports.checkGuesses = function(inRegistered, inSockets){
    exports.guesses++;
    if(exports.guesses == (inRegistered.length-1)*exports.guessesPerUser){
        
        chatBot.chatMeta.message = 'No one was able to guess: ' + exports.words.words[exports.words.index];
        inSockets.emit('chat', chatBot.chatMeta);
        
        exports.randomStart(inRegistered);
    }
};