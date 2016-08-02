module Main where

import Control.Monad
import Data.Char
import Data.List
import System.Environment
import System.Exit
import qualified Data.Map as Map

main = do
  args <- getArgs
  when (length args /= 2) $ do
    putStrLn "Expected filename usage: "
    name <- getProgName
    putStrLn $ name ++ " [quote file] [acrostic file]"
    exitFailure
  -- load the file
  let [quoteFile,acroFile] = args
  contents <- readFile quoteFile
  -- parse out extra info
  let (author:title:quote) = lines contents
  -- process into source
  let text = source $ unlines quote
  let acroInitial = concat $ source $ author ++ title
  let words = length text
  let letters = sum $ map length text
  putStrLn "Source text:"
  putStrLn $ wrap text 80
  putStrLn $ "Words: " ++ show words ++ " Letters: " ++ show letters
  -- checking viability
  let textHist = letterHistogram $ concat text
  let acroInitialHist = letterHistogram $ acroInitial
  unless (acroInitialHist `foundIn` textHist) $ do
    putStrLn "Not viable:"
    putStrLn $ showHistogram $ acroInitialHist `dropping` textHist
    exitSuccess
  let acroWords = length acroInitial
  let lpw = letters `div` acroWords
  putStrLn $ "Viable!  Acrostic will be " ++ show acroWords ++ " words, using " ++ 
             show letters ++ " letters (~" ++ show lpw ++ " letters per word)."
  putStrLn $ showHistogram $ textHist `dropping` acroInitialHist
  -- showing letter numbering
  putStrLn "Letter numbering: "
  putStrLn $ showNumbering $ letterNumbering $ concat text
  -- reading current state of acrostic
  acro <- readFile acroFile
  let acroHist = letterHistogram $ concat $ source $ acro
  putStrLn "Acrostic histogram:"
  putStrLn $ showHistogram (acroHist `dropping` acroInitialHist)
  putStrLn "\nCurrent status:"
  if (acroHist == textHist) 
  then do
    putStrLn "DONE!"
  else if (acroHist `foundIn` textHist) 
  then do
    putStrLn $ "OK, letters left:"
    putStrLn $ showHistogram $ Map.filter (> 0) $ textHist `dropping` acroHist
  else do
    putStrLn $ "BAD, overused letters:"
    putStrLn $ showHistogram $ Map.filter (> 0) $ acroHist `dropping` textHist

source :: String -> [String]
source = map (map toUpper . filter isAlphaNum) . words . depunctuate

depunctuate :: String -> String
depunctuate = map (\c -> if isPunctuation c || isSymbol c then ' ' else c)

wrap :: [String] -> Int -> String
wrap ws line = wrapAux ws line line

wrapAux :: [String] -> Int -> Int -> String
wrapAux [] line left = ""
wrapAux (w:ws) line left 
  | length w < left = w ++ " " ++ wrapAux ws line (left - length w - 1)
  | otherwise = "\n" ++ w ++ " " ++  wrapAux ws line (line - length w - 1)

showHistogram :: Map.Map Char Int -> String
showHistogram h = 
  Map.foldrWithKey 
    (\c count acc -> 
       [c] ++ ": " ++ show count ++ "\t" ++ replicate count c ++ "\n" ++ acc)
    "" h

letterHistogram :: String -> Map.Map Char Int
letterHistogram s = histogram s `Map.union` Map.fromList [(x,0) | x <- ['A'..'Z']]

showNumbering :: Map.Map Char [Int] -> String
showNumbering n = 
  Map.foldrWithKey 
    (\c locs acc -> 
       [c] ++ ": " ++ intercalate " " (map show $ sort locs) ++ "\n" ++ acc)
    "" n

letterNumbering :: String -> Map.Map Char [Int]
letterNumbering s = 
  let located = zip s [1..] in
  foldl (\m (c,loc) -> Map.insertWith (++) c [loc] m) Map.empty located 

histogram :: Ord a => [a] -> Map.Map a Int
histogram l = foldl (\m x -> Map.insertWith (+) x 1 m) Map.empty l

foundIn = Map.isSubmapOfBy (<=)

dropping = Map.differenceWith (\textC infoC -> Just $ textC - infoC)