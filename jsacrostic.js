var clueRE = RegExp('^\\w$');
var blackRE = RegExp('^\\s$');
var punctRE = RegExp('^[-\"]$');

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
    var q = quote.toUpperCase(); 

    assert(typeof quote === "string");
    assert(typeof width === "number");

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
             c: s.type === SQ_ENTRY ? " " : s.c };
};

clearBoard = function (b) {
    var newB = cloneBoard(b);

    var squares = [];
    for (var i = 0;i < b.squares.length;i++) {
        squares.push(clearSquare(b.squares[i]));
    }

    return { height: b.height, width: b.width, squares: squares };
};
