exports.addMetaToSocket = function(inSocket){
    inSocket.chatMeta = {
        alias:'',
        registered:false,
        id:inSocket.conn.id,
        message:'',
        points:0,
        drawing:false
    };
    return inSocket;
};

exports.removeFromArray = function(inItemWithMeta, inArray){
    for(var i=0; i<inArray.length; i++){
        if(inArray[i].chatMeta.id === inItemWithMeta.chatMeta.id){
            inItemWithMeta.chatMeta.registered = false;
            inArray.splice(i, 1);
            return;
        }
    }
};

exports.addToArray = function(inItemWithMeta, inArray){
    inItemWithMeta.chatMeta.registered = true;
    inArray.push(inItemWithMeta);
};

exports.extractMetasFromArray = function(inArray){
    var out = [];
    for(var i=0; i<inArray.length; i++){
        out.push(inArray[i].chatMeta);
    }
    return out;
};