var express = require('express');
var http = require('http');
var socket_io = require('socket.io');

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
       
       if(registered.length == 1){
           inSocket.emit('state-drawing', inSocket.chatMeta);
       }else{
           inSocket.emit('state-guessing', inSocket.chatMeta);
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
    })
    
});



