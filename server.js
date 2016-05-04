var express = require('express');
var http = require('http');
var socket_io = require('socket.io');
var fishbowl = require('./fishbowl');

var serverExpress, serverHTTP, serverSockets;
var sockets, registered, drawing;

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

var game = {};
game.drawer = undefined;
game.words = undefined;
game.getState = function(){
    return {
        drawer:game.drawer.chatMeta,
        words:game.words
    };
};
game.checkGuess = function(inIndex){
    if(inIndex == game.words.index){
        return true;
    }else{
        return false;
    }
};
game.startRound = function(inDrawer){
    game.words = fishbowl(15);
    game.drawer = inDrawer;
    game.drawer.emit('state-drawing', game.getState());
    game.drawer.broadcast.emit('state-guessing', game.getState());
};
game.addGuesser = function(inGuesser){
    inGuesser.emit('state-guessing', game.getState());
};

serverSockets = socket_io(serverHTTP);
serverSockets.on('connection', function(inSocket){
    
    inSocket.chatMeta = {
        alias:'',
        registered:false,
        id:inSocket.conn.id,
        message:'',
        points:0,
        drawing:false
    };
    
    console.log('client has connected', inSocket.chatMeta);
    sockets.push(inSocket);
    
    inSocket.emit('members', extractMetas(registered));
    
    inSocket.on('disconnect', function(){
       console.log('client has disconnected', inSocket.chatMeta);
       removeFrom(inSocket, sockets);
       removeFrom(inSocket, registered);
       ///////////////////
       inSocket.broadcast.emit('left', inSocket.chatMeta);
    });
    
    inSocket.on('left', function(inMessage){
       removeFrom(inSocket, registered);
       console.log('client has signed out', inSocket.chatMeta);
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
           game.addGuesser(registered[1]);
       }else{
           if(registered.length > 2){
               game.addGuesser(inSocket);
           }
       }

       console.log('client has alias', inSocket.chatMeta);
       ///////////////////
       inSocket.broadcast.emit('joined', inSocket.chatMeta);
       
    });
    
    inSocket.on('chat', function(inMessage) {
        inSocket.chatMeta.message = inMessage;
        console.log('client said', inSocket.chatMeta.message);
        //////////////////
        inSocket.broadcast.emit('chat', inSocket.chatMeta);
        inSocket.chatMeta.message = '';
    });
    
    inSocket.on('draw', function(inPosition) {
        //////////////////
        inSocket.broadcast.emit('draw', inPosition);
    });
    
    inSocket.on('guess', function(inGuess){
        console.log("someone guessed", inGuess);
        //////////////////
        inSocket.broadcast.emit('guess', inGuess);
    });
    
    inSocket.on('correct', function(){
        inSocket.chatMeta.points++;
        //////////////////
        inSocket.broadcast.emit('correct', inSocket.chatMeta);
        
        //////////////////
        game.startRound(inSocket);
    });
    
});



