var express = require('express');
var http = require('http');
var socket_io = require('socket.io');
var game = require('./gameData/game');
var meta = require('./gameData/meta');
var chatBot = require('./gameData/chatBot');

var serverExpress, serverHTTP, serverSockets;
var sockets, registered;

sockets = []; // list of connected users
registered = []; // list of users that have signed on with a name

serverExpress = express();
serverExpress.use(express.static('public'));
serverHTTP = http.Server(serverExpress);
serverHTTP.listen(80);
serverSockets = socket_io(serverHTTP);
serverSockets.on('connection', function(inSocket){
    
    meta.addMetaToSocket(inSocket);
    sockets.push(inSocket);
    ///////////////////
    inSocket.emit('members', meta.extractMetasFromArray(registered));
    
    inSocket.on('disconnect', function(){
       meta.removeFromArray(inSocket, sockets);
       meta.removeFromArray(inSocket, registered);
       if(registered.length < 2){
            console.log("game must be shut down");
            inSocket.broadcast.emit('state-disabled', true);
       }else{
            if(inSocket.chatMeta.drawing){
                console.log("drawer has left! picking new random drawer.");
                game.randomStart(registered);
            }
       }
       ///////////////////
       inSocket.broadcast.emit('left', inSocket.chatMeta);
    });
    
    inSocket.on('left', function(inMessage){
       meta.removeFromArray(inSocket, registered);
       ///////////////////
       inSocket.broadcast.emit('left', inSocket.chatMeta);
       inSocket.chatMeta.alias = '';
       inSocket.chatMeta.registered = false;
    });
    
    inSocket.on('alias', function(inMessage){
       inSocket.chatMeta.alias = inMessage;
       meta.addToArray(inSocket, registered);
       if(registered.length == 2){
           game.startRound(registered[0]);
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
    inSocket.on('stroke', function(inStroke) {
        //////////////////
        inSocket.broadcast.emit('stroke', inStroke);
    });
    
    inSocket.on('clear', function(inValue) {
        //////////////////
        inSocket.broadcast.emit('clear', inValue);
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
        game.startRound(inSocket);
    });
    
});



