var express = require('express');
var http = require('http');
var socket_io = require('socket.io');

var serverExpress, serverHTTP, serverSockets;

serverExpress = express();
serverExpress.use(express.static('public'));

serverHTTP = http.Server(serverExpress);


serverSockets = socket_io(serverHTTP);
serverSockets.on('connection', function(inSocket){
    console.log('client has connected');
    
    inSocket.on('message', function(inMessage) {
        console.log('Received message:', inMessage);
        inSocket.broadcast.emit('message', inMessage)
    });
    
    inSocket.on('signIn', function(inData){
        console.log(inData);
        inSocket.broadcast.emit('signIn', inData);
    })
    
});


serverHTTP.listen(80);
