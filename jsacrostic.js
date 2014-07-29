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

    if (!("width" in b && 
          "height" in b && 
          "squares" in b)) {
        return false; 
    }

    if (!b.squares.every(isSquare)) { return false; }

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

squareId = function (i) { 
    assert(typeof i === "number");
    return "acrostic-square-" + i; 
};

clueId = function (i) { 
    assert(typeof i === "number");
    return "acrostic-clue-" + i; 
};

domOfBoard = function (b,id) {
    assert(isBoard(b));

    // TODO abstract out the document...who knows where it came from
    // can we just use jquery to do this?
    var board = document.createElement("div");
    // TODO abstract out these attributes
    board.setAttribute("class","acrostic-board");
    board.setAttribute("id",id);

    var row = undefined;
    var numRows = 0;
    var number = 0;
    for (var i = 0;i < b.squares.length;i++) {
        if (i % b.width === 0) {
            numRows += 1;
            row = document.createElement("div");
            row.setAttribute("class","acrostic-row");
            board.appendChild(row);
        }

        var s = b.squares[i];

        var square = document.createElement("span");
        square.setAttribute("class","acrostic-square " + s.type);
        if (s.type == SQ_ENTRY) {
            number += 1;
            square.setAttribute("id",squareId(number));
            
            var num = document.createElement("span");
            num.setAttribute("class","acrostic-square-number");
            num.appendChild(document.createTextNode(number));
            square.appendChild(num);
        }
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
    // TODO allow punctuation... can we reuse the squares above? but we should never have SQ_BLACK...
    return typeof cs === "object" &&
           "number" in cs &&
           "c" in cs;
};

isClueAnswer = function (ca) {
    if (typeof ca !== "object") { return false; }

    return ca.every(isClueSquare);
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

    if (!cl.clues.every(isClue)) { return false; }

    return (cl.author + cl.title) ===
           cl.clues.map(function (c) { 
               return c.answer[0].c; }).join("");
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
                     answer: answerOfCAN(sanitize(c.answer),c.numbers) });
    }

    return { author: sanitize(author), 
             title: sanitize(title), 
             clues: clues };
};

letterOfIndex = function (i) {
    assert(typeof i === "number" && 
           0 <= i && i < 51); // TODO crappy arbitrary limit...

    return "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".charAt(i);
};

domOfCluelist = function (cl,id) {
    assert(isCluelist(cl));

    // TODO abstract out document variable
    var cluelist = document.createElement("div");
    cluelist.setAttribute("class","acrostic-cluelist");
    cluelist.setAttribute("id",id);

    for (var i = 0;i < cl.clues.length;i++) {
        var c = cl.clues[i];

        var idx = letterOfIndex(i);

        var clueEntry = document.createElement("div");
        clueEntry.setAttribute("class","acrostic-clueentry");
        clueEntry.setAttribute("id","acrostic-clue-"+idx);

        // add the clue text
        var clue = document.createElement("span");
        clue.setAttribute("class","acrostic-clue");
        clue.appendChild(document.createTextNode(idx + ". " + c.clue));
        clueEntry.appendChild(clue);
        
        // add slots and the numbers
        var letters = document.createElement("div");
        letters.setAttribute("class","acrostic-letters");
        var numbers = document.createElement("div");
        numbers.setAttribute("class","acrostic-numbers");
        for (var j = 0;j < c.answer.length;j++) {   
            var answer = c.answer[j];
         
            // add the actual letter
            var letter = document.createElement("span");
            letter.setAttribute("class","acrostic-letter");
            letter.setAttribute("id",clueId(answer.number));
            letter.appendChild(document.createTextNode(answer.c));
            letters.appendChild(letter);

            // now add its number
            var number = document.createElement("span");
            number.setAttribute("class","acrostic-number");
            number.appendChild(document.createTextNode(answer.number));
            numbers.appendChild(number);
        }
        clueEntry.appendChild(letters);
        clueEntry.appendChild(numbers);

        // with everything wrapped up, save the clue entry and move on
        cluelist.appendChild(clueEntry);
    }

    return cluelist;
};


// TODO letter-indexing of squares, cross-checking

// TODO active bits
