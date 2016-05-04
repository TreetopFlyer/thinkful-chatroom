var Chat = angular.module("Chat", []);

Chat.factory("FactorySocket", [function(){
    return io();
}])

Chat.factory("FactoryUser", [function(){
    var user = {};
    user.alias = '';
    user.id = 0,
    user.message = '';
    user.authenticated = false;
    user.drawing = false;
    user.guessing = true;
    user.guesses = 3;
    user.points = 0;
    
    user.award = function(){
        user.points++;
        user.drawing = true;
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
        for(i=0; i<members.log.length; i++){
            if(members.log[i].id === inUserData.id){
                members.log[i].points++;
                members.log[i].drawing = true;
            }else{
                members.log[i].drawing = false;
            }
        }  
    };
    return members;
}]);

Chat.factory("FactoryWords", ["FactorySocket", "FactoryUser", function(inSocket, inUser){
    
    var words = {};
    
    words.user = inUser;
    words.socket = inSocket;
    
    words.all = ["word", "letter", "number", "person", "pen", "class", "people",
    "sound", "water", "side", "place", "man", "men", "woman", "women", "boy",
    "girl", "year", "day", "week", "month", "name", "sentence", "line", "air",
    "land", "home", "hand", "house", "picture", "animal", "mother", "father",
    "brother", "sister", "world", "head", "page", "country", "question",
    "answer", "school", "plant", "food", "sun", "state", "eye", "city", "tree",
    "farm", "story", "sea", "night", "day", "life", "north", "south", "east",
    "west", "child", "children", "example", "paper", "music", "river", "car",
    "foot", "feet", "book", "science", "room", "friend", "idea", "fish",
    "mountain", "horse", "watch", "color", "face", "wood", "list", "bird",
    "body", "dog", "family", "song", "door", "product", "wind", "ship", "area",
    "rock", "order", "fire", "problem", "piece", "top", "bottom", "king",
    "space"];
    
    words.list = [];
    for(var i=0; i<words.all.length; i++){
        words.list.push({word:words.all[i], index:i, guessed:false});
    }

    words.correct = 0;
    words.reset = function(){
        for(var i=0; i<words.all.length; i++){
            words.all[i].guessed = false;
        }
        words.correct = words.list[Math.floor(Math.random()*words.list.length)];
        console.log(words.correct);
    };
    words.click = function(inIndex){
        if(words.user.guesses <= 0 || !words.user.authenticated || words.user.drawing)
            return;
        
        words.user.guesses--;
        words.guess(inIndex);
        words.socket.emit('guess', inIndex);
        
        console.log(words.correct, words.list[inIndex]);
        if(words.correct === words.list[inIndex]){
            words.socket.emit('correct', words.correct);
        }
    };
    words.guess = function(inIndex){
        words.list[inIndex].guessed = true;
    };
    words.socket.on('guess', function(inGuess){
        console.log("incoming guess", inGuess);
        words.guess(inGuess);
    });
    words.socket.on('correct', function(inUser){
        
    });
    
    words.reset();
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
    
     //// game
    // correct guess
    sockets.on('correct', function(inUser){
        console.log("Correct answer by", inUser);
        inScope.members.award(inUser);
        inScope.$apply();
    });
    
    // draw mode
    sockets.on('state-drawing', function(inUser){
        inScope.user.drawing = true;
        inScope.user.guessing = false;
        inScope.$apply();
    })
    
    sockets.on('state-guessing', function(inUser){
        inScope.user.drawing = false;
        inScope.user.guessing = true;
        inScope.$apply();
    })
    
}]);