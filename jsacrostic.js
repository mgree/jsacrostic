var clueRE = /^\w$/;
var blackRE = /^\s$/;
var punctRE = /^[-"]$/;

var SQ_ENTRY = "acrostic-entry";
var SQ_BLACK = "acrostic-black";
var SQ_PUNCTUATION = "acrostic-punct";

assert = function (e) { if (!e) { throw "Failed assertion!"; } };

isSquareType = function (st) {
    return st === SQ_ENTRY || 
           st === SQ_BLACK || 
           st === SQ_PUNCTUATION;
};

isSquare = function (s) {
    return typeof s === "object" && 
           "type" in s && isSquareType(s.type) && 
           "c" in s && typeof s.c === "string";
};

typeOfCharacter = function (c) {
    return clueRE.test(c) ? SQ_ENTRY :
           blackRE.test(c) ? SQ_BLACK :
           punctRE.test(c) ? SQ_PUNCTUATION :
           undefined;
};

squareOfCharacter = function (c) {
    var type = typeOfCharacter(c);

    return type === undefined ? undefined : { type: type, c: c };
};

isBoard = function (b) {
    if (typeof b !== "object") { return false; }

    if (!("width" in b && "height" in b && "squares" in b)) { return false; }

    // shouldn't be bigger than the dimensions
    if (b.squares.length > b.width * b.height) { return false; }

    // but the dimensions should be a tight fit
    if (b.squares.length < b.width * (b.height - 1)) { return false; }

    return true;
};

boardOfQuote = function (quote, width) {
    assert(typeof quote === "string");
    assert(typeof width === "number");

    var q = quote.toUpperCase(); 

    var squares = [];
    var height = 1;
    var row = 0;
    for (var i = 0;i < q.length;i++) {
        var s = squareOfCharacter(q.charAt(i));
        if (s !== undefined) {
            if (row === width) {
                row = 0;
                height += 1;
            }

            squares.push(s);
            row += 1;
        }
    }

    return { width: width, height: height, squares: squares };
};

quoteOfBoard = function (b) {
    assert(isBoard(b));
    
    var quote = "";
    for (var i = 0;i < b.squares.length;i++) {
        var s = b.squares[i];
        if (s.type == SQ_ENTRY || s.type == SQ_PUNCTUATION) {
            quote += s.c;
        } else if (s.type == SQ_BLACK) {
            quote += " ";
        }
    }

    return quote;
};

domOfBoard = function (b) {
    assert(isBoard(b));

    // TODO abstract out the document...who knows where it came from
    // can we just use jquery to do this?
    var board = document.createElement("div");
    // TODO abstract out these attributes
    board.setAttribute("class","acrostic-board");

    var row = undefined;
    var numRows = 0;
    for (var i = 0;i < b.squares.length;i++) {
        if (i % b.width === 0) {
            numRows++;
            row = document.createElement("div");
            row.setAttribute("class","acrostic-row");
            board.appendChild(row);
        }

        var s = b.squares[i];

        var square = document.createElement("span");
        square.setAttribute("class","acrostic-square " + s.type);
        square.appendChild(document.createTextNode(s.c));

        row.appendChild(square);
    }

    assert(numRows == b.height);

    return board;
};

cloneSquare = function (s) {
    assert(isSquare(s));

    return { type: s.type, c: s.c };
};

cloneBoard = function (b) {
    assert(isBoard(b));

    var squares = [];
    for (var i = 0;i < b.squares.length;i++) {
        squares.push(cloneSquare(b.squares[i]));
    }

    return { height: b.height, width: b.width, squares: squares };   
};

clearSquare = function (s) {
    assert(isSquare(s));

    return { type: s.type,
             c: s.type === SQ_ENTRY ? '' : s.c };
};

clearBoard = function (b) {
    var newB = cloneBoard(b);

    var squares = [];
    for (var i = 0;i < b.squares.length;i++) {
        squares.push(clearSquare(b.squares[i]));
    }

    return { height: b.height, width: b.width, squares: squares };
};

isClueSquare = function (cs) {
    return typeof cs === "object" &&
           "number" in cs &&
           "c" in cs;
};

isClueAnswer = function (ca) {
    if (typeof ca !== "object") { return false; }

    for (var i = 0;i < ca.length;i++) {
        if (!isClueSquare(ca[i])) {
            return false;
        }
    }

    return true;
};

isClue = function (c) {
    return typeof c === "object" &&
           "answer" in c && isClueAnswer(c.answer) &&
           "clue" in c && typeof c.clue === "string";
};

isCluelist = function (cl) {
    if (typeof cl !== "object") { return false; }

    if (!("author" in cl && "title" in cl && "clues" in cl)) { 
        return false; 
    }

    var cluetext = cl.author + cl.title;
    if (cluetext.length !== clues.length) { return false; }
    
    for (var i = 0;i < cl.clues.length;i++) {
        var c = cl.clues[i];
        
        if (!(isClue(c) &&
              sanitize(cluetext.charAt(i)) === 
              sanitize(c.answer[0].c))) {
            return false;
        }
    }

    return true;
};

answerOfCAN = function (answer, numbers) {
    assert(typeof answer === "string");
    assert(typeof numbers === "object");
    assert(answer.length === numbers.length);

    a = [];
    for (var i = 0;i < answer.length;i++) {
        a.push({ c: answer.charAt(i),
                 number: numbers[i] });
    }

    return a;
}

sanitize = function (s) {
    return s.toUpperCase().replace(/\s/g,"");
};

cluelistOfClues = function (cas, author, title) {
    assert(typeof cas === "object");
    assert(typeof author === "string");
    assert(typeof title === "string");

    var clues = [];
    for (var i = 0;i < cas.length;i++) {
        var c = cas[i];
        assert(typeof c === "object" &&
               "clue" in c && typeof c.clue === "string" &&
               "answer" in c && typeof c.answer === "string" &&
               "numbers" in c && typeof c.numbers === "object");
        clues.push({ clue: c.clue, 
                     answer: answerOfCAN(c.answer,c.numbers) });
    }

    return { author: sanitize(author), 
             title: sanitize(title), 
             clues: clues };
};

// TODO lettering of clues, numbering of squares
