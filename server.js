var express = require('express');
var http = require('http');
var socket_io = require('socket.io');

var serverExpress, serverHTTP, serverSockets;
var sockets;

serverExpress = express();
serverExpress.use(express.static('public'));

serverHTTP = http.Server(serverExpress);
serverHTTP.listen(80);

sockets = [];
serverSockets = socket_io(serverHTTP);
serverSockets.on('connection', function(inSocket){
    
    inSocket.chatMeta = {
        alias:'',
        registered:false,
        id:inSocket.conn.id,
        message:''
    };
    console.log('client has connected', inSocket.chatMeta);
    sockets.push(inSocket.chatMeta);
    
    //
    var members = [];
    for(var i=0; i<sockets.length; i++){
        if(sockets[i].registered){
            members.push(sockets[i]);
        }
    }
    inSocket.emit('members', members);

    
    inSocket.on('disconnect', function(){
       console.log('client has disconnected', inSocket.chatMeta);
       for(var i=0; i<sockets.length; i++){
           if(sockets[i].id === inSocket.chatMeta.id){
               sockets.splice(i, 1);
               break;
           }
       }
       ///////////////////
       inSocket.broadcast.emit('left', inSocket.chatMeta);
    });
    
    inSocket.on('left', function(inMessage){
       console.log('client has signed out', inSocket.chatMeta);
       ///////////////////
       inSocket.broadcast.emit('left', inSocket.chatMeta);
       inSocket.chatMeta.alias = '';
       inSocket.chatMeta.registered = false;
    });
    
    inSocket.on('alias', function(inMessage){
       inSocket.chatMeta.alias = inMessage;
       inSocket.chatMeta.registered = true;
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
    
});



