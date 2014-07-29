/* TODO XXX representation!  I have the strong suspicion that my
 * representation choices here were wrong. right now, any way you
 * slice it, it's annoying to come up with both the quote and the
 * cluelist, and it's tricky to keep them in sync. it might be easier
 * to view the quote board as just being a structure and then working
 * almost entirely with cluelists. eh.
 */
(jsacrostic = function ($) {
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
           "c" in s && typeof s.c === "string" &&
           (s.clue === undefined || typeof s.clue === "string");
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
          "squares" in b &&
          "number" in b)) {
        return false; 
    }

    if (typeof b.number !== "number") { return false; }

    if (!b.squares.every(isSquare)) { return false; }

    // shouldn't be bigger than the dimensions
    if (b.squares.length > b.width * b.height) { return false; }

    // but the dimensions should be a tight fit
    if (b.squares.length < b.width * (b.height - 1)) { return false; }

    // TODO check that b.number matches with number of entries in b.squares

    return true;
};

boardOfQuote = function (quote, width) {
    assert(typeof quote === "string");
    assert(typeof width === "number");

    var q = quote.toUpperCase(); 

    var squares = [];
    var height = 1;
    var row = 0;
    var number = 0;
    for (var i = 0;i < q.length;i++) {
        var s = squareOfCharacter(q.charAt(i));
        if (s !== undefined) {
            if (row === width) {
                row = 0;
                height += 1;
                number += 1;
            }

            squares.push(s);
            row += 1;
        }
    }

    return { width: width, height: height, 
             squares: squares, number: number };
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

            var clue = document.createElement("span");
            clue.setAttribute("class","acrostic-square-clue");
            if ("clue" in s) {
                clue.appendChild(document.createTextNode(s.clue));
            }
            square.appendChild(clue);
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
    var squares = [];
    for (var i = 0;i < b.squares.length;i++) {
        squares.push(clearSquare(b.squares[i]));
    }

    return { height: b.height, width: b.width, squares: squares };
};

isClueSquare = function (cs) {
    // TODO can we reuse the squares above? 
    // but we should never have SQ_BLACK...
    // some of this representation probably isn't the easiest :/
    return typeof cs === "object" &&
           (cs.number === undefined || typeof cs.number === "number") &&
           typeof cs.c === "string";
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

slotOfCAN = function (answer, number) {
    return { c: answer,
             // TODO this is sloppy
             number: punctRE.test(answer) ? undefined : number };
};

answerOfCAN = function (answer, numbers) {
    assert(typeof answer === "string");
    assert(typeof numbers === "object");
    assert(answer.length === numbers.length);

    a = [];
    for (var i = 0;i < answer.length;i++) {
        a.push(slotOfCAN(answer.charAt(i), numbers[i]));
    }

    return a;
};

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

letterBoard = function (b, cl) {
    var mapping = {};
    var number = 0;
    for (var i = 0;i < b.squares.length;i++) {
        if (b.squares[i].type === SQ_ENTRY) {
            number += 1;
            mapping[number] = i;
        }
    }

    for (var i = 0;i < cl.clues.length;i++) {
        var a = cl.clues[i].answer;
        for (var j = 0;j < a.length;j++) {
            if (a[j].number !== undefined) {
                var idx = mapping[a[j].number];
                var ltr = letterOfIndex(i);

                b.squares[idx].clue = ltr;
            }
        }
    }

    return b;
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
            if (answer.number !== undefined) {
                letter.setAttribute("id",clueId(answer.number));
            }
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

// TODO cross-checking

// TODO active bits

F_BOARD = "board";
F_CLUES = "clues";

cloneState = function (state) {
    assert(isState(state));

    return { number: state.number, 
             focus: state.focus === F_BOARD ? F_BOARD : F_CLUES };
}

isState = function (state) {
    return typeof state === "object" &&
           "number" in state && typeof state.number === "number" &&
           "focus" in state && (state.focus === F_BOARD || 
                                state.focus === F_CLUES);
};

flipFocus = function (state) {
    assert(isState(state));

    return { number: state.number, 
             focus: state.focus === F_BOARD ? F_CLUES : F_BOARD };
}

updateDisplay = function (state) {
    assert(isState(state));

    // drop old mapping
    $(".acrostic-primary").removeClass("acrostic-primary");
    $(".acrostic-secondary").removeClass("acrostic-secondary");

    // add new ones
    var board = $("#"+squareId(state.number));
    var clue = $("#"+clueId(state.number));
    var primary = state.focus === F_BOARD ? board : clue;
    var secondary = state.focus === F_BOARD ? clue : board;

    primary.addClass("acrostic-primary");
    secondary.addClass("acrostic-secondary");
};

K_TAB = 9;
K_LEFT = 37;
K_UP = 38;
K_RIGHT = 39;
K_DOWN = 40;

playAcrostic = function (initialState, board, clues) {
    var state = cloneState(initialState);

    var clueIndexOf = {};
    for (var i = 0;i < clues.clues.length;i++) {
        var a = clues.clues[i].answer;
        for (var j = 0;j < a.length;j++) {
            if (a[j].number !== undefined) {
                clueIndexOf[a[j].number] = { clue: i, idx: j };
            }
        }
    }

    moveFocus = function (state,key) {
        assert(isState(state));

        var number = 
            key === K_LEFT ? state.number - 1 :
            key === K_RIGHT ? state.number + 1 :
            key === K_UP ? assert(false) :
            key === K_DOWN ? assert(false) : assert(false);
        return { focus: state.focus,
                 number: state.focus === F_BOARD ? number : assert(false) };
    };

    $("body").keydown(function (evt) {
        if (evt.keyCode === K_TAB) {
            state = flipFocus(state);
        } else if (K_LEFT <= evt.keyCode && evt.keyCode <= K_DOWN)  {
            state = moveFocus(state, evt.keyCode);
        } else {
            console.log(evt);
        }

        updateDisplay(state);
    });
};

});
