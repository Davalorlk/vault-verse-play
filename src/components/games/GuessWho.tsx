import React, { useState, useEffect } from 'react';

// Guess Who game logic for two players (simplified demo)

// Add more detailed characters for Guess Who
const CHARACTERS = [
  { name: 'Alice', hair: 'blonde', glasses: true, hat: false, gender: 'female', hobby: 'painting' },
  { name: 'Bob', hair: 'brown', glasses: false, hat: true, gender: 'male', hobby: 'cycling' },
  { name: 'Carol', hair: 'red', glasses: true, hat: false, gender: 'female', hobby: 'reading' },
  { name: 'Dave', hair: 'black', glasses: false, hat: false, gender: 'male', hobby: 'cooking' },
  { name: 'Eve', hair: 'blonde', glasses: false, hat: true, gender: 'female', hobby: 'music' },
  { name: 'Frank', hair: 'brown', glasses: true, hat: false, gender: 'male', hobby: 'gardening' }
];

export function GuessWho({ roomName, user, isMyTurn, playMode }: { roomName: string, user: any, isMyTurn: boolean, playMode: 'player' | 'computer' }) {
  const [myCharacter, setMyCharacter] = useState('');
  const [guess, setGuess] = useState('');
  const [opponentGuess, setOpponentGuess] = useState('');
  const [winner, setWinner] = useState('');
  const [askedQuestions, setAskedQuestions] = useState<Set<string>>(new Set());
  const [remainingCharacters, setRemainingCharacters] = useState(CHARACTERS);

  useEffect(() => {
    if (playMode === 'player') {
      // Firebase logic removed
    } else {
      setMyCharacter('');
      setGuess('');
      setOpponentGuess('');
      setWinner('');
      setAskedQuestions(new Set());
      setRemainingCharacters(CHARACTERS);
    }
  }, [roomName, user.displayName, playMode]);

  function chooseCharacter(char: string) {
    const charObj = CHARACTERS.find(c => c.name === char);
    if (!charObj) return;
    if (playMode === 'player') {
      // Firebase logic removed
      setMyCharacter(charObj.name);
    } else {
      setMyCharacter(charObj.name);
    }
  }

  function makeGuess() {
    if (playMode === 'player') {
      // Firebase logic removed
      if (guess === myCharacter) setWinner(user.displayName);
    } else {
      if (!myCharacter) return;
      // Computer randomly picks a character
      const compChar = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)].name;
      if (guess === compChar) setWinner(user.displayName);
      else setWinner('Computer');
    }
  }

  // --- Smarter Guess Who AI helpers ---
  function getBestGuessWhoQuestion(remaining: any[], asked: Set<string>) {
    // Find the attribute that splits the remaining characters most evenly and hasn't been asked
    const attrs = ['hair', 'glasses', 'hat', 'gender', 'hobby'];
    let bestAttr = null, bestScore = 999;
    for (const attr of attrs) {
      if (asked.has(attr)) continue;
      const values = new Set(remaining.map(c => c[attr]));
      if (values.size < 2) continue;
      // Score: how close to half/half split
      for (const val of values) {
        const count = remaining.filter(c => c[attr] === val).length;
        const score = Math.abs(remaining.length/2 - count);
        if (score < bestScore) {
          bestScore = score;
          bestAttr = { attr, val };
        }
      }
    }
    return bestAttr;
  }
  function getBestGuessWhoGuess(remaining: any[]) {
    // If only one left, guess it
    if (remaining.length === 1) return remaining[0].name;
    // Otherwise, pick randomly
    return remaining[Math.floor(Math.random()*remaining.length)].name;
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full space-y-2">
      <div>Choose your character:</div>
      <div className="flex gap-2 mb-2 flex-wrap">
        {CHARACTERS.map(char => (
          <button key={char.name} className={`px-2 py-1 rounded ${myCharacter === char.name ? 'bg-yellow-400' : 'bg-slate-500'} font-bold shadow`} onClick={() => chooseCharacter(char.name)}>
            <div>{char.name}</div>
            <div className="text-xs text-slate-200">{char.gender}, {char.hair} hair{char.glasses ? ', glasses' : ''}{char.hat ? ', hat' : ''}</div>
            <div className="text-xs text-slate-300">Hobby: {char.hobby}</div>
          </button>
        ))}
      </div>
      <div className="mt-2">Guess opponent's character:</div>
      <input value={guess} onChange={e => setGuess(e.target.value)} className="border px-2" />
      <button onClick={makeGuess} className="ml-2 bg-yellow-400 px-2 rounded shadow hover:bg-yellow-500 transition">Guess</button>
      {winner && <div className="text-green-500 font-bold text-lg">Winner: {winner}</div>}
    </div>
  );
}
