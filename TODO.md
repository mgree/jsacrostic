* core library
** JSON encoding of a puzzle
*** embeddable in the URL bar base64 encoded (2083 char max)?
*** meaningful functions
clueListOfClues : clues -> author -> title -> cluelist
boardOfQuote : quote -> int -> board
letterBoard : board -> cluelist -> letterboard
domOfBoard
*** option 1: board primary

{ title : string
, ideal_width : int
, board : array { answer : { space : () | symbol : char | char : char }
                , number : int 
                , clue : int 
                , clue_index: int 
                }
, clues : array { clue : string
                , spaces : array { space : () | symbol : char | blank : () }
                }
}

*** option 2: clues primary

{ title : string
, ideal_width : int
, board : array { space : () | symbol : char | blank : () }
, clues : array { clue : string
                , answer : array { space : () | symbol : char | char : char }
                , board_loc : int
                }
}
* play
** single HTML page
** load files
*** can they fit in the uRL?
** use localStorage for offline storage
** win detection
* author
** dictionary support
** DND resizing of puzzle screen
** letter shuffling
** vowel ratios
** export to a self-contained play file
** graph coloring/bin packing algorithm for numbering for duplicate letters?
