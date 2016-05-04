var express = require('express');
var http = require('http');
var socket_io = require('socket.io');
var fishbowl = require('./fishbowl');

var serverExpress, serverHTTP, serverSockets;
var sockets, registered;

serverExpress = express();
serverExpress.use(express.static('public'));

serverHTTP = http.Server(serverExpress);
serverHTTP.listen(80);


sockets = [];
registered = [];

function removeFrom(inItemWithMeta, inArray){
    for(var i=0; i<inArray.length; i++){
        if(inArray[i].chatMeta.id === inItemWithMeta.chatMeta.id){
            inItemWithMeta.chatMeta.registered = false;
            inArray.splice(i, 1);
            return;
        }
    }
}
function addTo(inItemWithMeta, inArray){
    inItemWithMeta.chatMeta.registered = true;
    inArray.push(inItemWithMeta);
}
function extractMetas(inArray){
    var out = [];
    for(var i=0; i<inArray.length; i++){
        out.push(inArray[i].chatMeta);
    }
    return out;
}
function assignMeta(inSocket){
    inSocket.chatMeta = {
        alias:'',
        registered:false,
        id:inSocket.conn.id,
        message:'',
        points:0,
        drawing:false
    };
}

var game = {};
game.drawer = undefined;
game.words = undefined;
game.guesses = 0;
game.guessesPerUser = 3;
game.getState = function(){
    return {
        drawer:game.drawer.chatMeta,
        words:game.words
    };
};
game.startRound = function(inDrawer){
    
    if(game.drawer){
        game.drawer.chatMeta.drawing = false;
    }
    
    game.guesses = 0;
    game.words = fishbowl(15);
    game.drawer = inDrawer;
    game.drawer.chatMeta.drawing = true;
    game.drawer.emit('state-drawing', game.getState());
    game.drawer.broadcast.emit('state-guessing', game.getState());
};
game.addGuesser = function(inGuesser){
    inGuesser.emit('state-guessing', game.getState());
};
game.randomStart = function(inRegistered){
    game.startRound(inRegistered[Math.floor(inRegistered.length*Math.random())]);
}
game.checkGuesses = function(inRegistered, inSockets){
    game.guesses++;
    if(game.guesses == (inRegistered.length-1)*game.guessesPerUser){
        
        chatBot.chatMeta.message = 'No one was able to guess: ' + game.words.words[game.words.index];
        inSockets.emit('chat', chatBot.chatMeta);
        
        game.randomStart(inRegistered);
    }
};

var chatBot = {conn:{id:1}};
assignMeta(chatBot);
chatBot.chatMeta.alias = 'ChatBot';

serverSockets = socket_io(serverHTTP);
serverSockets.on('connection', function(inSocket){
    
    assignMeta(inSocket);
    sockets.push(inSocket);
    
    inSocket.emit('members', extractMetas(registered));
    
    inSocket.on('disconnect', function(){

       removeFrom(inSocket, sockets);
       removeFrom(inSocket, registered);
       
       if(inSocket.chatMeta.drawing){
           console.log("drawer has left! oh no!");
           
           if(registered.length > 1){
               console.log("reset with random drawer");
               game.randomStart(registered);
           }else{
               console.log("game must be shut down");
               inSocket.broadcast.emit('state-disabled', game.getState());
           }
           
       }
       
       ///////////////////
       inSocket.broadcast.emit('left', inSocket.chatMeta);
    });
    
    inSocket.on('left', function(inMessage){
       removeFrom(inSocket, registered);
       ///////////////////
       inSocket.broadcast.emit('left', inSocket.chatMeta);
       inSocket.chatMeta.alias = '';
       inSocket.chatMeta.registered = false;
    });
    
    inSocket.on('alias', function(inMessage){
       inSocket.chatMeta.alias = inMessage;
       addTo(inSocket, registered);
       
       if(registered.length == 2){
           game.startRound(registered[0]);
           //game.addGuesser(registered[1]);
       }else{
           if(registered.length > 2){
               game.addGuesser(inSocket);
           }
       }
       ///////////////////
       inSocket.broadcast.emit('joined', inSocket.chatMeta);
    });
    
    inSocket.on('chat', function(inMessage) {
        inSocket.chatMeta.message = inMessage;
        //////////////////
        inSocket.broadcast.emit('chat', inSocket.chatMeta);
        inSocket.chatMeta.message = '';
    });
    
    inSocket.on('draw', function(inPosition) {
        //////////////////
        inSocket.broadcast.emit('draw', inPosition);
    });
    
    inSocket.on('guess', function(inGuess){
        game.checkGuesses(registered, serverSockets);
        //////////////////
        inSocket.broadcast.emit('guess', inGuess);
    });
    
    inSocket.on('correct', function(){
        inSocket.chatMeta.points++;
        //////////////////
        inSocket.broadcast.emit('correct', inSocket.chatMeta);
        chatBot.chatMeta.message = inSocket.chatMeta.alias + ' guessed correct: ' + game.words.words[game.words.index];
        serverSockets.emit('chat', chatBot.chatMeta);
        //////////////////
        game.startRound(inSocket);
    });
    
});



