var clueRE = RegExp('^\\w$');
var blackRE = RegExp('^\\s$');
var punctRE = RegExp('^[-\"]$');

var SQ_ENTRY = 0;
var SQ_BLACK = 1;
var SQ_PUNCTUATION = 2;

assert = function (e) { if (!e) { console.log("Failed assertion!"); } };

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
            squares.push(s);

            row += 1;
            if (row === width) {
                row = 0;
                height +=1;
            }
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
}

domOfBoard = function (b) {
    assert(isBoard(b));
}

// for testing
quote = "Now at last without fantasies or self-deception, cut off from the mistakes and confusion of the past, grave and simple, carrying a small suitcase, getting on a bus, like girls in movies leaving home, convents, lovers, I supposed I would get started on my real life."
author = "Alice Munro";
title = "Lives of Girls and Women";

assert(isBoard(boardOfQuote(quote,20)));
assert(isBoard(boardOfQuote(quote,25)));
assert(isBoard(boardOfQuote(quote,32)));
