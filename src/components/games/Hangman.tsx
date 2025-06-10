// Hangman game logic for two players (simplified demo)
import { useEffect, useState } from 'react';

const WORDS = ['react', 'firebase', 'hangman', 'puzzle', 'logic'];

function getRandomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

// --- Smarter Hangman AI: dictionary-based pattern matching ---
const LETTER_FREQUENCY = 'etaoinshrdlucmfwypvbgkjqxz'.split('');
const DICTIONARY = [
  'react', 'firebase', 'hangman', 'puzzle', 'logic', 'garden', 'music', 'cooking', 'reading', 'cycling', 'painting', 'blonde', 'brown', 'black', 'red', 'male', 'female', 'hobby', 'hat', 'glasses'
];
function getBestHangmanGuess(word: string, guesses: string[]): string {
  // Use revealed pattern to filter dictionary
  const pattern = word.split('').map(l => (guesses.includes(l) ? l : '_')).join('');
  const regex = new RegExp('^' + pattern.replace(/_/g, '.') + '$');
  const candidates = DICTIONARY.filter(w => w.length === word.length && regex.test(w) && w.split('').every(l => /^[a-z]$/.test(l)));
  // Count letter frequency in candidates
  const freq: Record<string, number> = {};
  for (const w of candidates) {
    for (const l of w) {
      if (!guesses.includes(l)) freq[l] = (freq[l] || 0) + 1;
    }
  }
  // Pick the most frequent unused letter
  let best = '', bestCount = -1;
  for (const l in freq) {
    if (freq[l] > bestCount) {
      best = l;
      bestCount = freq[l];
    }
  }
  // Fallback to frequency order
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
  // For demo: two rounds, one for each player
  const [round, setRound] = useState(1); // 1 or 2
  const [winner, setWinner] = useState<string | null>(null);
  const [wordEntry, setWordEntry] = useState('');
  const [wordSet, setWordSet] = useState(false);

  useEffect(() => {
    if (playMode === 'player') {
      // Firebase logic removed
    } else {
      setWord(getRandomWord());
      setGuesses([]);
      setWrong(0);
    }
  }, [roomName, playMode]);

  function handleGuess() {
    if (!isMyTurn || !input) return;
    if (guesses.includes(input)) return;
    if (playMode === 'player') {
      const newGuesses = [...guesses, input];
      // Firebase logic removed
      if (!word.includes(input)) setWrong(wrong + 1);
      setInput('');
    } else {
      const newGuesses = [...guesses, input];
      setGuesses(newGuesses);
      if (!word.includes(input)) setWrong(wrong + 1);
      setInput('');
    }
  }

  const display = word.split('').map(l => (guesses.includes(l) ? l : '_')).join(' ');
  const lost = wrong >= 6;
  const won = word && word.split('').every(l => guesses.includes(l));

  useEffect(() => {
    if (playMode === 'computer' && !lost && !won && guesses.length && !isMyTurn) {
      setTimeout(() => {
        // Smarter computer guess
        const guess = getBestHangmanGuess(word, guesses);
        if (guess) {
          setGuesses([...guesses, guess]);
          if (!word.includes(guess)) setWrong(w => w + 1);
        }
      }, 800);
    }
  }, [guesses, playMode, lost, won, isMyTurn, word]);

  // Reset for next round
  function startNextRound() {
    setGuesses([]);
    setWrong(0);
    setInput('');
    setWord('');
    setWordEntry('');
    setWordSet(false);
    setWinner(null);
    setRound(r => r === 1 ? 2 : 1);
  }

  // Handle word entry for each round
  function handleSetWord() {
    if (!wordEntry || wordEntry.length < 2) return;
    setWord(wordEntry.toLowerCase());
    setWordSet(true);
  }

  // Determine who is the guesser and who is the word-setter
  const isWordSetter = (round === 1 && user?.player === 1) || (round === 2 && user?.player === 2);
  const isGuesser = !isWordSetter;

  // Win/loss logic for two players
  useEffect(() => {
    if (!wordSet) return;
    if (word && word.length && (wrong >= 6 || word.split('').every(l => guesses.includes(l)))) {
      if (word.split('').every(l => guesses.includes(l))) {
        setWinner(isGuesser ? String(round) : null);
      } else if (wrong >= 6) {
        setWinner(isWordSetter ? String(round) : null);
      }
    }
  }, [guesses, wrong, word, wordSet, isGuesser, isWordSetter, round]);

  function renderHangmanFigure(wrong: number) {
    // Draw hangman with SVG, dots for incomplete
    return (
      <svg width="120" height="160" viewBox="0 0 120 160">
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

  return (
    <div className="flex flex-col md:flex-row w-full h-full items-stretch">
      {/* Instructions */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white text-black p-6 border-r border-gray-300">
        <div className="text-2xl font-bold mb-2">THE HANGMAN</div>
        <div className="mb-4 text-center">
          One player thinks of a word or phrase, and the other player tries to guess.<br />
          Make sure to black out extras if player guesses the wrong word.<br />
          The line is filled on hangman, if hangman diagram has completed, the guesser has lost the game.
        </div>
        <div className="mt-8 text-center font-semibold">ENJOY THE GAME AND HAVE FUN :)</div>
      </div>
      {/* Game boards */}
      <div className="flex-[2] flex flex-col items-center justify-center bg-slate-900 text-white p-6">
        {[1,2].map((r) => (
          <div key={r} className="flex flex-col items-center mb-8 w-full max-w-md">
            <div className="flex flex-row justify-between w-full mb-2">
              <div className="flex gap-2">
                {Array.from({length: 8}).map((_,i) => <span key={i} className="inline-block w-6 border-b-2 border-white text-lg text-center">{(round===r && wordSet && word[i] && (guesses.includes(word[i]) || winner)) ? word[i] : '\u00A0'}</span>)}
              </div>
              <div className="ml-4">WINNER: <span className="font-bold">{winner === String(r) ? (user?.displayName || 'Player '+r) : ''}</span></div>
            </div>
            <div className="flex flex-row items-center gap-8">
              {renderHangmanFigure(round === r && wordSet ? wrong : 0)}
              <div className="flex flex-col items-center">
                <div className="mb-2">{Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map(l => (
                  <span key={l} className={`inline-block w-5 text-center mx-0.5 ${guesses.includes(l.toLowerCase()) && round===r && wordSet ? 'text-red-400 line-through' : ''}`}>{l}</span>
                ))}</div>
                {round === r && !wordSet && isWordSetter && (
                  <div className="flex gap-2 mt-2">
                    <input value={wordEntry} onChange={e => setWordEntry(e.target.value.replace(/[^a-zA-Z]/g, '').toLowerCase())} maxLength={8} className="border px-2 text-black" placeholder="Enter word" />
                    <button onClick={handleSetWord} className="bg-green-400 px-2 rounded shadow hover:bg-green-500 transition">Set Word</button>
                  </div>
                )}
                {round === r && wordSet && !won && !lost && isGuesser && (
                  <div className="flex gap-2 mt-2">
                    <input value={input} onChange={e => setInput(e.target.value.toLowerCase())} maxLength={1} className="border px-2 text-black" disabled={!isGuesser || lost || won} />
                    <button onClick={handleGuess} className="bg-yellow-400 px-2 rounded shadow hover:bg-yellow-500 transition" disabled={!isGuesser || lost || won}>Guess</button>
                  </div>
                )}
                {round === r && wordSet && lost && <div className="text-red-400 font-bold mt-2">Game Over! Word was: {word}</div>}
                {round === r && wordSet && won && <div className="text-green-400 font-bold mt-2">You Win!</div>}
                {round === r && wordSet && (won || lost) && (
                  <button className="mt-2 bg-blue-500 text-white px-3 py-1 rounded" onClick={startNextRound}>Next Round</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
