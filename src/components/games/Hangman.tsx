// Hangman game logic for two players, with real-time state sync via Firebase (simplified demo)
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, set } from 'firebase/database';

const WORDS = ['react', 'firebase', 'hangman', 'puzzle', 'logic'];

function getRandomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

export function Hangman({ roomName, user, isMyTurn, playMode }: { roomName: string, user: any, isMyTurn: boolean, playMode: 'player' | 'computer' }) {
  const [word, setWord] = useState('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [wrong, setWrong] = useState(0);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (playMode === 'player') {
      const wordRef = ref(db, `rooms/${roomName}/games/hangman/word`);
      const guessesRef = ref(db, `rooms/${roomName}/games/hangman/guesses`);
      const wrongRef = ref(db, `rooms/${roomName}/games/hangman/wrong`);
      onValue(wordRef, snap => { if (snap.exists()) setWord(snap.val()); });
      onValue(guessesRef, snap => { if (snap.exists()) setGuesses(snap.val()); });
      onValue(wrongRef, snap => { if (snap.exists()) setWrong(snap.val()); });
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
      set(ref(db, `rooms/${roomName}/games/hangman/guesses`), newGuesses);
      if (!word.includes(input)) set(ref(db, `rooms/${roomName}/games/hangman/wrong`), wrong + 1);
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
        // Computer guesses a random letter
        const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
        const available = alphabet.filter(l => !guesses.includes(l));
        if (available.length) {
          const guess = available[Math.floor(Math.random() * available.length)];
          setGuesses([...guesses, guess]);
          if (!word.includes(guess)) setWrong(w => w + 1);
        }
      }, 800);
    }
  }, [guesses, playMode, lost, won, isMyTurn, word]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full space-y-2">
      <div className="text-2xl tracking-widest font-mono mb-2">{display}</div>
      <div>Wrong guesses: {wrong}/6</div>
      <input value={input} onChange={e => setInput(e.target.value)} maxLength={1} className="border px-2" disabled={!isMyTurn || lost || won} />
      <button onClick={handleGuess} className="ml-2 bg-yellow-400 px-2 rounded shadow hover:bg-yellow-500 transition" disabled={!isMyTurn || lost || won}>Guess</button>
      {lost && <div className="text-red-500 font-bold text-lg">Game Over! Word was: {word}</div>}
      {won && <div className="text-green-500 font-bold text-lg">You Win!</div>}
    </div>
  );
}
