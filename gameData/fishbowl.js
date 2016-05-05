var words = ["word", "letter", "number", "person", "pen", "class", "people",
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

function draw(inCount){
    
    var i;
    var copy;
    var output;
    var pick;
    
    if(inCount > words.length){
        inCount = words.length;
    }
    
    copy = [];
    for(i=0; i<inCount; i++){
        copy.push(words[i]);
    }
    
    output = {};
    output.words = [];
    output.index = 0;
    for(i=0; i<inCount; i++){
        pick = Math.floor(Math.random()*copy.length);
        output.words.push(copy.splice(pick, 1)[0]);
    }
    output.index = Math.floor(Math.random()*output.words.length);
    
    return output;
}

module.exports = draw;