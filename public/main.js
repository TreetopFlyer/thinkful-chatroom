var Chat = angular.module("Chat", []);

Chat.factory("FactorySocket", [function(){
    return io();
}])

Chat.factory("FactoryUser", ["FactorySocket", function(inSocket){
    var user = {};
    user.alias = '';
    user.id = inSocket.id,
    user.message = '';
    user.authenticated = false;
    user.drawing = false;
    user.guessing = false;
    user.guesses = 3;
    user.points = 0;
    
    user.award = function(){
        console.log("Client awarded! the dom may need updating tho :(");
        user.points++;
        user.guesses = 0;
    };
    
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
    members.drawing = false;
    members.add = function(inUserData){
        members.log.push({
            alias: inUserData.alias,
            id: inUserData.id,
            message: inUserData.message,
            points: inUserData.points,
            drawing: inUserData.drawing
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
    members.award = function(inUserData){
        var i;
        console.log("Trying to award", inUserData);
        console.log("Searching", members.log);
        for(i=0; i<members.log.length; i++){
            if(members.log[i].id === inUserData.id){
                members.log[i].points++;
                console.log("Awarding", members.log[i].alias);
                return;
            }
        }  
    };
    members.setDrawing = function(inUser){
        console.log("set drawing ", inUser);
        /*
        members.noDrawing();
        
        var i;
        for(i=0; i<members.log.length; i++){
            if(members.log[i].id === inUserData.id){
                members.drawing = members.log[i];
                members.drawing.drawing = true;
                return;
            }
        }  
        */
    };
    members.noDrawing = function(){
        /*
        if(members.drawing){
            members.drawing.drawing = false;
        }
        */
    };
    
    return members;
}]);

Chat.factory("FactoryWords", ["FactorySocket", "FactoryUser", "FactoryMembers", function(inSocket, inUser, inMembers){
    
    var words = {};
    
    words.user = inUser;
    words.socket = inSocket;
    words.members = inMembers;
    
    words.list = [];
    words.correct = 0;
    words.create = function(inFishbowl){
        words.list = [];
        for(var i=0; i<inFishbowl.words.length; i++){
            words.list.push({word:inFishbowl.words[i], index:i, guessed:false});
        }
        words.correct = words.list[inFishbowl.index];
    };
    
    words.click = function(inIndex){
        if(words.user.guesses <= 0 || !words.user.authenticated || words.user.drawing)
            return;
        
        words.user.guesses--;
        words.guess(inIndex);
        if(words.correct === words.list[inIndex]){
            words.members.award(words.user);
            words.socket.emit('correct', words.correct);
        }else{
            words.socket.emit('guess', inIndex);
        }
    };
    words.guess = function(inIndex){
        words.list[inIndex].guessed = true;
    };
    
    return words;
}]);

Chat.directive("ngDrawing", ["FactorySocket", "$parse", function(inSocket, inParser){
    return {
        restrict:'A',
        link: function(inScope, inElement, inAttributes){
            
            var canvas, context;
            var handlerDown, handlerMove, handlerUp;
            var interactivityEnable, interactivityDisable;
            var draw;

            canvas = $(inElement[0]);
            context = canvas.get(0).getContext('2d');
            canvas[0].width = canvas[0].offsetWidth;
            canvas[0].height = canvas[0].offsetHeight;
            
            draw = function(inPosition) {
                context.beginPath();
                context.arc(inPosition.x, inPosition.y, 6, 0, 2 * Math.PI);
                context.fill();
            };
            inSocket.on('draw', draw);

            handlerDown = function(inEvent){
                canvas.unbind('mousedown', handlerDown);
                $(document).bind('mouseup', handlerUp);
                canvas.bind('mousemove', handlerMove);
            };
            handlerMove = function(inEvent){
                        
                var offset = canvas.offset();
                var pos = {x:inEvent.pageX - offset.left, y:inEvent.pageY - offset.top};
 
                draw(pos);
                inSocket.emit('draw', pos);
            };
            handlerUp = function(inEvent){
                $(document).unbind('mouseup', handlerUp);
                canvas.unbind('mousemove', handlerMove);
                canvas.bind('mousedown', handlerDown);
            };
            
            
            interactivityDisable = function(){
                $(document).unbind('mouseup', handlerUp);
                canvas.unbind('mousemove', handlerMove);
                canvas.unbind('mousedown', handlerDown);
            };
            interactivityEnable = function(){
                interactivityDisable();
                canvas.bind('mousedown', handlerDown);
            };
            
            inScope.$watch(function(inScope){
                return inParser(inAttributes.ngInteractive)(inScope);
            }, function(inNew, inOld){
                if(inNew){
                    interactivityEnable();
                }else{
                    interactivityDisable();
                }
            });
        }  
    };
}]);

Chat.controller("ControllerChat", ["$scope", "FactorySocket", "FactoryUser", "FactoryMessages", "FactoryMembers", "FactoryWords", function(inScope, inSocket, inUser, inMessages, inMembers, inWords){
    
    var sockets = inSocket;
    
    inScope.user = inUser;
    inScope.messages = inMessages;
    inScope.members = inMembers;
    inScope.words = inWords;
    
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
        inScope.members.add(inUser);
        inScope.$apply();
    });
    // send logout
    inScope.aliasRevoke = function(){
        inScope.user.authenticated = false;
        inScope.members.remove(inUser);
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
    
     //// game
    // guess
    sockets.on('guess', function(inGuess){
        console.log("incoming guess", inGuess);
        inScope.words.guess(inGuess);
        inScope.$apply();
    });
    // correct guess
    sockets.on('correct', function(inUser){
        console.log('CORRECT event recieved', inUser);
        inScope.members.award(inUser);
        inScope.$apply();
    });
    
     //// game states
    // draw mode
    sockets.on('state-drawing', function(inState){
        inScope.words.create(inState.words);
        inScope.user.drawing = true;
        inScope.user.guessing = false;
        
        inScope.members.setDrawing(inState.drawer);
        inScope.$apply();
    });
    // guess mode
    sockets.on('state-guessing', function(inState){
        inScope.words.create(inState.words);
        inScope.user.guesses = 3;
        inScope.user.drawing = false;
        inScope.user.guessing = true;
        
        inScope.members.setDrawing(inState.drawer);
        inScope.$apply();
    });
    // all off
    sockets.on('state-disabled', function(inState){
        inScope.user.drawing = false;
        inScope.user.guessing = false;
        
        inScope.members.noDrawing();
        inScope.$apply();
    });
    
}]);