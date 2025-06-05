// Guess Who game logic for two players, with real-time state sync via Firebase (simplified demo)
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, set } from 'firebase/database';

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

  useEffect(() => {
    if (playMode === 'player') {
      const myCharRef = ref(db, `rooms/${roomName}/games/guesswho/${user.displayName}/character`);
      const oppGuessRef = ref(db, `rooms/${roomName}/games/guesswho/${user.displayName}/guess`);
      onValue(myCharRef, snap => { if (snap.exists()) setMyCharacter(snap.val()); });
      onValue(oppGuessRef, snap => { if (snap.exists()) setOpponentGuess(snap.val()); });
    } else {
      setMyCharacter('');
      setGuess('');
      setOpponentGuess('');
      setWinner('');
    }
  }, [roomName, user.displayName, playMode]);

  function chooseCharacter(char: string) {
    const charObj = CHARACTERS.find(c => c.name === char);
    if (!charObj) return;
    if (playMode === 'player') {
      set(ref(db, `rooms/${roomName}/games/guesswho/${user.displayName}/character`), charObj.name);
      setMyCharacter(charObj.name);
    } else {
      setMyCharacter(charObj.name);
    }
  }

  function makeGuess() {
    if (playMode === 'player') {
      set(ref(db, `rooms/${roomName}/games/guesswho/${user.displayName}/guess`), guess);
      if (guess === myCharacter) setWinner(user.displayName);
    } else {
      if (!myCharacter) return;
      // Computer randomly picks a character
      const compChar = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)].name;
      if (guess === compChar) setWinner(user.displayName);
      else setWinner('Computer');
    }
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
