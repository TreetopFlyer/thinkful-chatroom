var express = require('express');
var http = require('http');
var socket_io = require('socket.io');

var serverExpress, serverHTTP, serverSockets;

serverExpress = express();
serverExpress.use(express.static('public'));

serverHTTP = http.Server(serverExpress);
serverHTTP.listen(80);

serverSockets = socket_io(serverHTTP);
serverSockets.on('connection', function(inSocket){
    
    inSocket.chatMeta = {
        alias:'anon',
        id:inSocket.conn.id,
        message:''
    };
    
    console.log('client has connected', inSocket.chatMeta);
    
    inSocket.on('disconnect', function(){
       console.log('client has disconnected', inSocket.chatMeta);
       ///////////////////
       inSocket.broadcast.emit('left', chatMeta);
    });
    
    inSocket.on('joined', function(inMessage){
       inSocket.alias = inMessage;
       ///////////////////
       inSocket.broadcast.emit('joined', chatMeta);
    });
    
    inSocket.on('message', function(inMessage) {
        inSocket.chatMeta.message = inMessage;
        //////////////////
        inSocket.broadcast.emit('message', inSocket.chatMeta);
        inSocket.chatMeta.message = '';
    });
    
});



