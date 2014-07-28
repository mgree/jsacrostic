var clueRE = RegExp('^\\w$');
var blackRE = RegExp('^\\s$');
var punctRE = RegExp('^[-\"]$');

var SQ_CLUE = 0;
var SQ_BLACK = 1;
var SQ_PUNCTUATION = 2;

isSquareType = function (st) {
    return st === SQ_CLUE || 
           st === SQ_BLACK || 
           st === SQ_PUNCTUATION;
}

isSquare = function (s) {
    return typeof s === "object" && 
           "type" in s && isSquareType(s.type) && 
           "c" in s && typeof s.c === "string";
}

typeOfCharacter = function (c) {
    return clueRE.test(c) ? SQ_CLUE :
           blackRE.test(c) ? SQ_BLACK :
           punctRE.test(c) ? SQ_PUNCTUATION :
           undefined;
}

squareOfCharacter = function (c) {
    var type = typeOfCharacter(c);

    return type === undefined ? undefined : { type: type, c: c };
};

isBoard = function (b) {
    if (typeof b !== "object") { return false; }

    if (!("width" in b && "height" in b && "squares" in b)) { return false; }

    if (b.squares.length > b.width * b.height) { return false; }

    return true;
};

boardOfQuote = function (quote, width) {
    var q = quote.toUpperCase();  

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
    quote = "";
    for (i = 0;i < b.squares.length;i++) {
        s = b.squares[i];
        if (s.type == SQ_CLUE || s.type == SQ_PUNCTUATION) {
            quote += s.c;
        } else if (s.type == SQ_BLACK) {
            quote += " ";
        }
    }

    return quote;
}

quote = "Now at last without fantasies or self-deception, cut off from the mistakes and confusion of the past, grave and simple, carrying a small suitcase, getting on a bus, like girls in movies leaving home, convents, lovers, I supposed I would get started on my real life."
//  - Alice Munro, "Lives of Girls and Women"
