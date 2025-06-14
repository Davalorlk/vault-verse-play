
import { useEffect, useState } from 'react';
import { socket } from '@/lib/socket';

const WORDS = ['react', 'firebase', 'hangman', 'puzzle', 'logic', 'computer', 'keyboard', 'mystery', 'challenge', 'victory'];

function getRandomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

const LETTER_FREQUENCY = 'etaoinshrdlucmfwypvbgkjqxz'.split('');
const DICTIONARY = [
  'react', 'firebase', 'hangman', 'puzzle', 'logic', 'computer', 'keyboard', 'mystery', 'challenge', 'victory',
  'garden', 'music', 'cooking', 'reading', 'cycling', 'painting', 'blonde', 'brown', 'black', 'red', 'male', 'female', 'hobby', 'hat', 'glasses'
];

function getBestHangmanGuess(word: string, guesses: string[]): string {
  const pattern = word.split('').map(l => (guesses.includes(l) ? l : '_')).join('');
  const regex = new RegExp('^' + pattern.replace(/_/g, '.') + '$');
  const candidates = DICTIONARY.filter(w => w.length === word.length && regex.test(w) && w.split('').every(l => /^[a-z]$/.test(l)));
  
  const freq: Record<string, number> = {};
  for (const w of candidates) {
    for (const l of w) {
      if (!guesses.includes(l)) freq[l] = (freq[l] || 0) + 1;
    }
  }
  
  let best = '', bestCount = -1;
  for (const l in freq) {
    if (freq[l] > bestCount) {
      best = l;
      bestCount = freq[l];
    }
  }
  
  if (!best) {
    const available = LETTER_FREQUENCY.filter(l => !guesses.includes(l));
    return available[0] || '';
  }
  return best;
}

export function Hangman({ roomName, user, isMyTurn, playMode }: { roomName: string, user: any, isMyTurn: boolean, playMode: 'player' | 'computer' }) {
  const [word, setWord] = useState('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [wrong, setWrong] = useState(0);
  const [input, setInput] = useState('');
  const [round, setRound] = useState(1);
  const [winner, setWinner] = useState<string | null>(null);
  const [wordEntry, setWordEntry] = useState('');
  const [wordSet, setWordSet] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [myPlayerIndex, setMyPlayerIndex] = useState<number>(0);
  const [currentGuesser, setCurrentGuesser] = useState<number>(1);
  const [currentWordSetter, setCurrentWordSetter] = useState<number>(0);
  const [scores, setScores] = useState<{[key: number]: number}>({0: 0, 1: 0});

  useEffect(() => {
    if (playMode === 'player') {
      socket.emit('join-game-room', { roomName, gameId: 'hangman' });
      
      socket.on('game-initialized', (data: { playerIndex: number, gameStarted: boolean }) => {
        console.log('Hangman game initialized:', data);
        setMyPlayerIndex(data.playerIndex);
        setGameStarted(data.gameStarted);
      });
      
      const handleGameState = (state: any) => {
        console.log('Hangman game state update received:', state);
        if (state.word !== undefined) {
          setWord(state.word);
          setGuesses(state.guesses || []);
          setWrong(state.wrong || 0);
          setWordSet(state.wordSet || false);
          setRound(state.round || 1);
          setCurrentGuesser(state.currentGuesser ?? 1);
          setCurrentWordSetter(state.currentWordSetter ?? 0);
          setWinner(state.winner);
          setScores(state.scores || {0: 0, 1: 0});
        }
      };
      
      const handlePlayerJoined = (data: { playersCount: number }) => {
        console.log('Hangman player joined:', data);
        if (data.playersCount === 2) {
          setGameStarted(true);
        }
      };
      
      socket.on('game-state-update', handleGameState);
      socket.on('player-joined', handlePlayerJoined);
      
      return () => {
        socket.off('game-state-update', handleGameState);
        socket.off('game-initialized');
        socket.off('player-joined', handlePlayerJoined);
      };
    } else {
      setWord(getRandomWord());
      setGuesses([]);
      setWrong(0);
      setGameStarted(true);
      setWordSet(true);
    }
  }, [roomName, playMode]);

  function handleGuess() {
    if (!input || guesses.includes(input.toLowerCase())) return;
    
    const letter = input.toLowerCase();
    const newGuesses = [...guesses, letter];
    const newWrong = !word.includes(letter) ? wrong + 1 : wrong;
    
    setGuesses(newGuesses);
    setWrong(newWrong);
    setInput('');
    
    if (playMode === 'player') {
      console.log('Emitting Hangman guess:', letter);
      socket.emit('game-state-update', {
        roomName,
        gameId: 'hangman',
        state: { 
          word,
          guesses: newGuesses,
          wrong: newWrong,
          wordSet,
          round,
          currentGuesser,
          currentWordSetter,
          winner,
          scores
        }
      });
    }
  }

  function handleSetWord() {
    if (!wordEntry || wordEntry.length < 2) return;
    
    const newWord = wordEntry.toLowerCase().replace(/[^a-z]/g, '');
    setWord(newWord);
    setWordSet(true);
    setWordEntry('');
    
    if (playMode === 'player') {
      console.log('Emitting Hangman word set:', newWord);
      socket.emit('game-state-update', {
        roomName,
        gameId: 'hangman',
        state: { 
          word: newWord,
          guesses: [],
          wrong: 0,
          wordSet: true,
          round,
          currentGuesser,
          currentWordSetter,
          winner,
          scores
        }
      });
    }
  }

  const display = word.split('').map(l => (guesses.includes(l) ? l : '_')).join(' ');
  const lost = wrong >= 6;
  const won = word && word.split('').every(l => guesses.includes(l));

  useEffect(() => {
    if (playMode === 'computer' && !lost && !won && guesses.length && !isMyTurn) {
      setTimeout(() => {
        const guess = getBestHangmanGuess(word, guesses);
        if (guess) {
          setGuesses([...guesses, guess]);
          if (!word.includes(guess)) setWrong(w => w + 1);
        }
      }, 800);
    }
  }, [guesses, playMode, lost, won, isMyTurn, word]);

  // Check for round end and scoring
  useEffect(() => {
    if (wordSet && (won || lost)) {
      const newScores = {...scores};
      if (won) {
        // Guesser wins
        newScores[currentGuesser] = (newScores[currentGuesser] || 0) + 1;
      } else if (lost) {
        // Word setter wins
        newScores[currentWordSetter] = (newScores[currentWordSetter] || 0) + 1;
      }
      setScores(newScores);
      
      // Check for overall winner after 2 rounds
      if (round >= 2) {
        if (newScores[0] > newScores[1]) {
          setWinner('Player 1');
        } else if (newScores[1] > newScores[0]) {
          setWinner('Player 2');
        } else {
          setWinner('Draw');
        }
      }
    }
  }, [won, lost, wordSet, round, currentGuesser, currentWordSetter, scores]);

  function startNextRound() {
    const newRound = round + 1;
    const newGuesser = currentWordSetter;
    const newWordSetter = currentGuesser;
    
    setGuesses([]);
    setWrong(0);
    setInput('');
    setWord('');
    setWordEntry('');
    setWordSet(false);
    setRound(newRound);
    setCurrentGuesser(newGuesser);
    setCurrentWordSetter(newWordSetter);
    
    if (playMode === 'player') {
      socket.emit('game-state-update', {
        roomName,
        gameId: 'hangman',
        state: { 
          word: '',
          guesses: [],
          wrong: 0,
          wordSet: false,
          round: newRound,
          currentGuesser: newGuesser,
          currentWordSetter: newWordSetter,
          winner: null,
          scores
        }
      });
    }
  }

  function renderHangmanFigure(wrong: number) {
    return (
      <svg width="120" height="160" viewBox="0 0 120 160" className="mx-auto">
        {/* Gallows */}
        <line x1="10" y1="150" x2="110" y2="150" stroke="#222" strokeWidth="3" />
        <line x1="30" y1="150" x2="30" y2="20" stroke="#222" strokeWidth="3" />
        <line x1="30" y1="20" x2="80" y2="20" stroke="#222" strokeWidth="3" />
        <line x1="80" y1="20" x2="80" y2="40" stroke="#222" strokeWidth="3" />
        {/* Head */}
        {wrong > 0 ? <circle cx="80" cy="55" r="15" stroke="#222" strokeWidth="3" fill="none" /> : <circle cx="80" cy="55" r="15" stroke="#aaa" strokeWidth="2" fill="none" strokeDasharray="3 5" />}
        {/* Body */}
        {wrong > 1 ? <line x1="80" y1="70" x2="80" y2="110" stroke="#222" strokeWidth="3" /> : <line x1="80" y1="70" x2="80" y2="110" stroke="#aaa" strokeWidth="2" strokeDasharray="3 5" />}
        {/* Left Arm */}
        {wrong > 2 ? <line x1="80" y1="80" x2="60" y2="100" stroke="#222" strokeWidth="3" /> : <line x1="80" y1="80" x2="60" y2="100" stroke="#aaa" strokeWidth="2" strokeDasharray="3 5" />}
        {/* Right Arm */}
        {wrong > 3 ? <line x1="80" y1="80" x2="100" y2="100" stroke="#222" strokeWidth="3" /> : <line x1="80" y1="80" x2="100" y2="100" stroke="#aaa" strokeWidth="2" strokeDasharray="3 5" />}
        {/* Left Leg */}
        {wrong > 4 ? <line x1="80" y1="110" x2="65" y2="140" stroke="#222" strokeWidth="3" /> : <line x1="80" y1="110" x2="65" y2="140" stroke="#aaa" strokeWidth="2" strokeDasharray="3 5" />}
        {/* Right Leg */}
        {wrong > 5 ? <line x1="80" y1="110" x2="95" y2="140" stroke="#222" strokeWidth="3" /> : <line x1="80" y1="110" x2="95" y2="140" stroke="#aaa" strokeWidth="2" strokeDasharray="3 5" />}
      </svg>
    );
  }

  const isWordSetter = playMode === 'computer' || (playMode === 'player' && myPlayerIndex === currentWordSetter);
  const isGuesser = playMode === 'computer' || (playMode === 'player' && myPlayerIndex === currentGuesser);
  const isMyTurnToPlay = playMode === 'computer' || (playMode === 'player' && gameStarted);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-3">
      {/* Status Display */}
      {playMode === 'player' && (
        <div className="mb-4 text-center w-full">
          {!gameStarted ? (
            <div className="text-yellow-500 font-bold text-sm sm:text-base p-3 bg-slate-800/50 rounded-lg">
              Waiting for another player to join...
            </div>
          ) : (
            <div className="space-y-2 p-3 bg-slate-800/50 rounded-lg">
              <div className="text-white text-sm">
                You are: <span className="font-bold text-yellow-500 text-lg">Player {myPlayerIndex + 1}</span>
              </div>
              <div className="text-white text-sm">
                Round {round}/2 | Word Setter: Player {currentWordSetter + 1} | Guesser: Player {currentGuesser + 1}
              </div>
              <div className="text-white text-sm">
                Scores - Player 1: {scores[0] || 0} | Player 2: {scores[1] || 0}
              </div>
              <div className="text-xs text-slate-400">
                Role: {isWordSetter ? 'Word Setter' : 'Guesser'} | Game started: {gameStarted ? 'Yes' : 'No'}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="w-full max-w-2xl bg-slate-800 rounded-lg p-6 shadow-xl">
        {/* Game Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">HANGMAN</h2>
          {playMode === 'player' && (
            <div className="text-yellow-400 font-semibold">
              Round {round}/2 - {isWordSetter ? 'Set a word for your opponent' : 'Guess the word'}
            </div>
          )}
        </div>

        {/* Hangman Figure */}
        <div className="mb-6">
          {renderHangmanFigure(wrong)}
        </div>

        {/* Word Display */}
        {wordSet && (
          <div className="text-center mb-6">
            <div className="text-3xl font-mono font-bold text-white tracking-wider mb-2">
              {display || '_'.repeat(word.length)}
            </div>
            <div className="text-slate-400 text-sm">
              Wrong guesses: {wrong}/6
            </div>
          </div>
        )}

        {/* Alphabet Display */}
        {wordSet && (
          <div className="mb-6">
            <div className="text-center text-xs text-slate-400 mb-2">Available Letters:</div>
            <div className="flex flex-wrap justify-center gap-1">
              {Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map(letter => (
                <span 
                  key={letter} 
                  className={`inline-block w-6 h-6 text-center text-xs border rounded ${
                    guesses.includes(letter.toLowerCase()) 
                      ? 'bg-red-500 text-white line-through' 
                      : 'bg-slate-700 text-white'
                  }`}
                >
                  {letter}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Game Controls */}
        <div className="space-y-4">
          {/* Word Setting Phase */}
          {!wordSet && isWordSetter && isMyTurnToPlay && (
            <div className="text-center">
              <div className="text-white mb-2">Enter a word for your opponent to guess:</div>
              <div className="flex gap-2 justify-center">
                <input 
                  value={wordEntry} 
                  onChange={e => setWordEntry(e.target.value.replace(/[^a-zA-Z]/g, '').toLowerCase())} 
                  maxLength={12} 
                  className="border px-3 py-2 rounded bg-slate-700 text-white border-slate-600" 
                  placeholder="Enter word (letters only)"
                />
                <button 
                  onClick={handleSetWord} 
                  className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded shadow text-white font-bold transition"
                  disabled={!wordEntry.trim()}
                >
                  Set Word
                </button>
              </div>
            </div>
          )}

          {/* Guessing Phase */}
          {wordSet && !won && !lost && isGuesser && isMyTurnToPlay && (
            <div className="text-center">
              <div className="text-white mb-2">Guess a letter:</div>
              <div className="flex gap-2 justify-center">
                <input 
                  value={input} 
                  onChange={e => setInput(e.target.value.toLowerCase().replace(/[^a-z]/g, ''))} 
                  maxLength={1} 
                  className="border px-3 py-2 rounded bg-slate-700 text-white border-slate-600 w-16 text-center" 
                  placeholder="?"
                />
                <button 
                  onClick={handleGuess} 
                  className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded shadow text-slate-900 font-bold transition"
                  disabled={!input || guesses.includes(input)}
                >
                  Guess
                </button>
              </div>
            </div>
          )}

          {/* Round End */}
          {wordSet && (won || lost) && (
            <div className="text-center">
              {won && <div className="text-green-500 font-bold text-xl mb-2">Word Guessed! 🎉</div>}
              {lost && <div className="text-red-500 font-bold text-xl mb-2">Hangman Complete! 💀</div>}
              <div className="text-white mb-2">The word was: <span className="font-bold text-yellow-400">{word}</span></div>
              
              {round < 2 && !winner && (
                <button 
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow" 
                  onClick={startNextRound}
                >
                  Next Round
                </button>
              )}
            </div>
          )}

          {/* Game End */}
          {winner && (
            <div className="text-center">
              <div className="text-2xl font-bold mb-4 text-green-500">
                {playMode === 'computer' ? 
                  `Game Over! Winner: ${winner}` :
                  winner === `Player ${myPlayerIndex + 1}` ? 'You won the game! 🎉' : 
                  winner === 'Draw' ? 'It\'s a draw!' : 'You lost the game! 😢'
                }
              </div>
              <div className="text-white mb-4">
                Final Scores - Player 1: {scores[0] || 0} | Player 2: {scores[1] || 0}
              </div>
              <button
                onClick={() => {
                  setWord('');
                  setGuesses([]);
                  setWrong(0);
                  setInput('');
                  setRound(1);
                  setWinner(null);
                  setWordEntry('');
                  setWordSet(false);
                  setCurrentGuesser(1);
                  setCurrentWordSetter(0);
                  setScores({0: 0, 1: 0});
                  if (playMode === 'player') {
                    socket.emit('reset-game', { roomName, gameId: 'hangman' });
                  } else {
                    setWord(getRandomWord());
                    setWordSet(true);
                  }
                }}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow"
              >
                New Game
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
