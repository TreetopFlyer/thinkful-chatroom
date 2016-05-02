var Chat = angular.module("Chat", []);

Chat.factory("FactoryUser", [function(){
    var user = {};
    user.alias = '';
    user.id = 0,
    user.message = '';
    user.authenticated = false;
    return user;
}]);

Chat.factory("FactoryMessages", [function(){
    var messages = {};
    messages.limit = 10;
    messages.log = [];
    messages.add = function(inUserData){
        messages.log.push({
            alias: inUserData.alias,
            id: inUserData.id,
            message: inUserData.message
        });
        if(messages.log.length > messages.limit){
            messages.log.splice(0, 1);
        }
    };
    return messages;
}]);

Chat.factory("FactoryMembers", [function(){
    var members = {};
    members.log = [];
    members.add = function(inUserData){
        members.log.push({
            alias: inUserData.alias,
            id: inUserData.id,
            message: inUserData.message
        });
    };
    members.remove = function(inUserData){
        var i;
        for(i=0; i<members.log.length; i++){
            if(members.log[i].id === inUserData.id){
                members.log.splice(i, 1);
                return;
            }
        }  
    };
    return members;
}]);

Chat.controller("ControllerChat", ["$scope", "FactoryUser", "FactoryMessages", "FactoryMembers", function(inScope, inUser, inMessages, inMembers){
    var sockets = io();
    
    inScope.user = inUser;
    inScope.messages = inMessages;
    inScope.members = inMembers;
    
    
    sockets.on('members', function(inMembers){
        for(var i=0; i<inMembers.length; i++){
            inScope.members.add(inMembers[i]);
        }
        inScope.$apply();
    })
    
     //// users
    // send login
    inScope.aliasSubmit = function(){
        inScope.user.authenticated = true;
        inScope.members.add(inScope.user);
        sockets.emit('alias', inScope.user.alias);  
    };
    // recieve login
    sockets.on('joined', function(inUser){
        console.log('user joined', inUser);
        inScope.members.add(inUser);
        inScope.$apply();
    });
    // send logout
    inScope.aliasRevoke = function(){
        console.log("revoking alias");
        inScope.user.authenticated = false;
        inScope.members.remove(inUser);
        inScope.$apply();
        sockets.emit('left', inScope.user.alias);  
    };
    // recieve logout
    sockets.on('left', function(inUser){
        inScope.members.remove(inUser);
        inScope.$apply();
    });
    
     //// chat
    // send chat
    inScope.chatSubmit = function(){
        inScope.messages.add(inUser);
        sockets.emit('chat', inScope.user.message); 
        inScope.user.message = "";
    };
    // recieve chat
    sockets.on('chat', function(inMessage){
        inScope.messages.add(inMessage);
        inScope.$apply();
    });
    
}]);