/* TODO XXX representation!  I have the strong suspicion that my
 * representation choices here were wrong. right now, any way you
 * slice it, it's annoying to come up with both the quote and the
 * cluelist, and it's tricky to keep them in sync. it might be easier
 * to view the quote board as just being a structure and then working
 * almost entirely with cluelists. eh.
 *
 * TODO pushing '?' gets you to a help screen
 * TODO better layout of clues (sizing?)
 * TODO automatic reflowing CSS (use skeleton? minimum width of puzzle?)
 */
(jsacrostic = function ($) {

////////////////////////////////////////////////////////////////////////
// General purpose/utility functions
////////////////////////////////////////////////////////////////////////

var clueRE = /^\w$/;
var blackRE = /^\s$/;
var punctRE = /^[-"]$/;

var SQ_ENTRY = "acrostic-entry";
var SQ_BLACK = "acrostic-black";
var SQ_PUNCTUATION = "acrostic-punct";

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

sanitize = function (s) {
    return s.toUpperCase().replace(/\s/g,"");
};

// TODO crappy arbitrary limit...
var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
CLUE_CHARS = alphabet.concat(alphabet.toLowerCase());
MAX_CLUES = CLUE_CHARS.length;

letterOfIndex = function (i) {
    console.assert(typeof i === "number" && 
           0 <= i && i < MAX_CLUES); 

    return CLUE_CHARS.charAt(i);
};
    
////////////////////////////////////////////////////////////////////////
// Board structure
////////////////////////////////////////////////////////////////////////

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
    console.assert(typeof quote === "string");
    console.assert(typeof width === "number");

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
            }

            if (s.type === SQ_ENTRY) {
                number += 1;
                s.number = number;
            }

            squares.push(s);
            row += 1;
        }
    }

    return { width: width, height: height, 
             squares: squares, number: number };
};

quoteOfBoard = function (b) {
    console.assert(isBoard(b));
    
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

// TODO drop this dead code?
cloneSquare = function (s) {
    console.assert(isSquare(s));

    return { type: s.type, c: s.c };
};

cloneBoard = function (b) {
    console.assert(isBoard(b));

    var squares = [];
    for (var i = 0;i < b.squares.length;i++) {
        squares.push(cloneSquare(b.squares[i]));
    }

    return { height: b.height, width: b.width, squares: squares };   
};

clearSquare = function (s) {
    console.assert(isSquare(s));

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
    console.assert(typeof answer === "string");
    console.assert(typeof numbers === "object");
    console.assert(answer.length === numbers.length);

    a = [];
    for (var i = 0;i < answer.length;i++) {
        a.push(slotOfCAN(answer.charAt(i), numbers[i]));
    }

    return a;
};

cluelistOfClues = function (cas, author, title) {
    console.assert(typeof cas === "object");
    console.assert(typeof author === "string");
    console.assert(typeof title === "string");

    var clues = [];
    for (var i = 0;i < cas.length;i++) {
        var c = cas[i];
        console.assert(typeof c === "object" &&
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
    
////////////////////////////////////////////////////////////////////////
// Generating DOM representaitons of boards and cluelists
////////////////////////////////////////////////////////////////////////
    
squareId = function (i) { 
    console.assert(typeof i === "number",typeof i);
    return "acrostic-square-" + i; 
};

clueId = function (i) { 
    console.assert(typeof i === "number");
    return "acrostic-clue-" + i; 
};

domOfBoard = function (b,id) {
    console.assert(isBoard(b));

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

    console.assert(numRows == b.height);

    return board;
};

domOfCluelist = function (cl,id) {
    console.assert(isCluelist(cl));

    // TODO abstract out document variable
    var cluelist = document.createElement("div");
    cluelist.setAttribute("class","acrostic-cluelist");
    cluelist.setAttribute("id",id);

    for (var i = 0;i < cl.clues.length;i++) {
        var c = cl.clues[i];

        var idx = letterOfIndex(i);

        var clueEntry = document.createElement("div");
        clueEntry.setAttribute("class","acrostic-clueentry");
        clueEntry.setAttribute("id","acrostic-clueentry-"+idx);

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
            if (answer.number !== undefined) {
                number.setAttribute("class","acrostic-number");
                number.appendChild(document.createTextNode(answer.number));
            }
            numbers.appendChild(number);
        }
        clueEntry.appendChild(letters);
        clueEntry.appendChild(numbers);

        // with everything wrapped up, save the clue entry and move on
        cluelist.appendChild(clueEntry);
    }

    return cluelist;
};

////////////////////////////////////////////////////////////////////////
// User interface/widgets for playing
////////////////////////////////////////////////////////////////////////


F_BOARD = "board";
F_CLUES = "clues";

cloneState = function (state) {
    console.assert(isState(state));

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
    console.assert(isState(state));

    return { number: state.number, 
             focus: state.focus === F_BOARD ? F_CLUES : F_BOARD };
}

squareText = function (s) {
    var isTextNode = function () { return this.nodeType === 3; };

    return s.contents().filter(isTextNode);
}

typeCharacter = function (c) {
    var p = $(".acrostic-primary");
    var s = $(".acrostic-secondary");

    // update the square's text
    squareText(p).replaceWith(c);
    squareText(s).replaceWith(c);

    // and typing eliminates wrong marks
    p.removeClass("acrostic-wrong");
    s.removeClass("acrostic-wrong");
}

updateDisplay = function (state) {
    console.assert(isState(state));

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

    $('body').focus();
};

K_BACKSPACE = 8;
K_DELETE = 46;
K_TAB = 9;
K_LEFT = 37;
K_UP = 38;
K_RIGHT = 39;
K_DOWN = 40;

extractNumber = function (n) {
    // arcane enough for ya? :/
    return Number($(n).attr("id").split("-")[2]);
};

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

    var number = 0;
    var upOf = {};
    var downOf = {};
    for (var i = 0;i < board.squares.length;i++) {
        if (board.squares[i].type === SQ_ENTRY) {
            number += 1;

            for (var above = i-board.width;
                 above >= 0;
                 above -= board.width) {
                if (board.squares[above].type === SQ_ENTRY) {
                    upOf[number] = board.squares[above].number
                    break;
                }
            }

            for (var below = i+board.width;
                 below < board.squares.length;
                 below += board.width) {
                if (board.squares[below].type === SQ_ENTRY) {
                    downOf[number] = board.squares[below].number;
                    break;
                }
            }
        }
    }

    moveFocus = function (state,key) {
        console.assert(isState(state));

        var number = undefined;
        if (state.focus === F_BOARD) {
            number = 
                key === K_LEFT ? state.number - 1 :
                key === K_RIGHT ? state.number + 1 :
                key === K_UP ? upOf[state.number] :
                key === K_DOWN ? downOf[state.number] : 
                console.assert(false, "bad arrow key");
        } else {
            var ci = clueIndexOf[state.number];

            ci = key === K_LEFT ? { clue: ci.clue, idx: ci.idx - 1 } :
                 key === K_RIGHT ? { clue: ci.clue, idx: ci.idx + 1 } :
                 key === K_UP ? { clue: ci.clue-1, idx: 0 } :
                 key === K_DOWN ? { clue: ci.clue+1, idx: 0 } :
                 console.assert(false, "bad arrow key");

            if (ci.clue < 0 || ci.clue >= clues.clues.length ||
                ci.idx < 0 || ci.idx >= clues.clues[ci.clue].answer.length) {
                // TODO beep or something---an invalid move
                number = state.number;
            } else {
                number = clues.clues[ci.clue].answer[ci.idx].number;
            }
        }

        if (number === undefined || 
            number < 0 || number > board.number) {
            // TODO beep or something---an invalid move
            number = state.number;
        }
            
        return { focus: state.focus, number: number };
    };

    $("body").keydown(function (evt) {
        if (evt.keyCode === K_TAB) {
            evt.preventDefault();
            state = flipFocus(state);
        } else if (evt.keyCode === K_BACKSPACE || 
                   evt.keyCode === K_DELETE) {
            evt.preventDefault();
            typeCharacter(String.fromCharCode(""));
        } else if (K_LEFT <= evt.keyCode && evt.keyCode <= K_DOWN)  {
            evt.preventDefault();
            state = moveFocus(state, evt.keyCode);
        } else if (clueRE.test(String.fromCharCode(evt.which))) {
            // ??? should we bother updating board/clues? why/why not?
            // typing doesn't update the state...
            typeCharacter(String.fromCharCode(evt.which));

            // ... but we move to the right, if we can
            state = moveFocus(state, K_RIGHT);
        } else {
            console.log(evt);
        }

        updateDisplay(state);
    });

    $("span.acrostic-square[id^=acrostic-square-]").click(function (evt) {
        state = { number: extractNumber(evt.currentTarget), focus: F_BOARD };
        updateDisplay(state);
    });

    $("span.acrostic-letter[id^=acrostic-clue-]").click(function (evt) {
        state = { number: extractNumber(evt.currentTarget), focus: F_CLUES };
        updateDisplay(state);
    });

    $("span.acrostic-number").click(function (evt) {
        state = { number: Number($(evt.currentTarget).text()), focus: F_CLUES };
        updateDisplay(state);
    });

    updateDisplay(state);
};

checkSquare = function(id) {
    var sq = $("span#" + squareId(id));
    var clue = $("span#" + clueId(id));
    
    var stext = squareText(sq).text();
    var ctext = squareText(clue).text();
    
    if (ctext !== "" && stext !== "" && stext !== ctext) {
        // mark wrong squares
        sq.addClass("acrostic-wrong");
        clue.addClass("acrostic-wrong");
        
        return false;
    }

    return true;
};

crossCheck = function () {
    var allCorrect = true;

    $("span.acrostic-square[id^=acrostic-square-]").each(function (idx) {
        var id = Number(extractNumber(this));
        if (!checkSquare(id)) {
            allCorrect = false;
        }
    });

    return allCorrect;
};

////////////////////////////////////////////////////////////////////////
// Statistics/info collection for readout when editing acrostics
////////////////////////////////////////////////////////////////////////

clueCharacters = function (s) {
    return s.replace(/\W/g,"").toUpperCase();
};

makeHistogram = function (s) {
    var h = {};

    for (var i = 0;i < alphabet.length;i++) {
        h[alphabet[i]] = 0;
    }

    for (var i = 0;i < s.length;i++) {
        h[s[i]] = h[s[i]] + 1;
    }

    return h;
};

showHistogram = function (h) {
    var margin = {top: 20, right: 20, bottom: 30, left: 40},
        width  = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;
    
    var x = d3.scale.ordinal().rangeRoundBands([0, width], .1);

    var y = d3.scale.linear().range([height, 0]);

    var xAxis = d3.svg.axis().scale(x).orient("bottom");

    var yAxis = d3.svg.axis().scale(y).orient("left").ticks(10);

    var svg = d3.select("#histogram").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var data = [];
    for (var c in h) {
        data.push({ letter: c, occurences: h[c] });
    }
    console.log(h);
    console.log(data);

    x.domain(data.map(function(d) { return d.letter; }));
    y.domain([0, d3.max(data, function(d) { return d.occurences; })]);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);
    
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Occurences");
    
    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d.letter); })
        .attr("width", x.rangeBand())
        .attr("y", function(d) { return y(d.occurences); })
        .attr("height", function(d) { return height - y(d.occurences); });
};

updateReadout = function () {
    var quote = clueCharacters($("#quote").val());
    var author = clueCharacters($("#author").val());
    var title = clueCharacters($("#title").val());
    var acrostic = author + title;

    var numClues = acrostic.length;

    var hQuote = makeHistogram(quote);
    var hAcrostic = makeHistogram(author.concat(title));

    // check to make sure the acrostic is realizable
    var badLetters = [];
    
    for (var i = 0;i < alphabet.length;i++) {
        var c = alphabet[i];
        if (hAcrostic[c] > hQuote[c]) {
            badLetters.push(c);
        }
    }

    if (badLetters.length > 0) {
        $("#errors").append(
            "This acrostic is unrealizable. There are letters that occur in the " +
            "acrostic (author and title) that don't appear in the quote: " +
            badLetters.join(", "));
    }

    showHistogram(hQuote);
        
};

});
