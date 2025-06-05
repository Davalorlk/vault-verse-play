// Ludo game logic for two players (simplified demo)
import { useEffect, useState } from 'react';

const initialPositions = [0, 0]; // [player1, player2] positions

function getNextTurn(turn: number) {
  return turn === 0 ? 1 : 0;
}

// Smarter Ludo AI: maximize progress, block opponent if possible
function getBestLudoMove(positions: number[], turn: number) {
  // Try to land on or pass the opponent if possible
  const myPos = positions[turn];
  const oppPos = positions[1 - turn];
  let bestRoll = 1;
  let bestScore = -Infinity;
  for (let roll = 1; roll <= 6; roll++) {
    let newPos = Math.min(myPos + roll, 20);
    let score = newPos;
    if (newPos === oppPos) score += 5; // Prefer landing on opponent
    if (newPos > oppPos) score += 2; // Prefer passing opponent
    if (newPos === 20) score += 10; // Prefer winning
    if (score > bestScore) {
      bestScore = score;
      bestRoll = roll;
    }
  }
  return bestRoll;
}

export function Ludo({ roomName, user, isMyTurn, playMode }: { roomName: string, user: any, isMyTurn: boolean, playMode: 'player' | 'computer' }) {
  const [positions, setPositions] = useState(initialPositions);
  const [turn, setTurn] = useState(0);
  const [dice, setDice] = useState<number|null>(null);

  useEffect(() => {
    setPositions(initialPositions);
    setTurn(0);
  }, [roomName, playMode]);

  function rollDice() {
    if (playMode === 'player') {
      if (!isMyTurn) return;
      const roll = Math.ceil(Math.random() * 6);
      setDice(roll);
      const newPositions = [...positions];
      newPositions[turn] = Math.min(newPositions[turn] + roll, 20);
      setPositions(newPositions);
      setTurn(getNextTurn(turn));
    } else {
      if (turn !== 0) return;
      const roll = getBestLudoMove(positions, 0);
      setDice(roll);
      const newPositions = [...positions];
      newPositions[0] = Math.min(newPositions[0] + roll, 20);
      setPositions(newPositions);
      setTurn(1);
      setTimeout(() => {
        // Computer move
        const compRoll = getBestLudoMove(newPositions, 1);
        const compPositions = [...newPositions];
        compPositions[1] = Math.min(compPositions[1] + compRoll, 20);
        setPositions(compPositions);
        setTurn(0);
      }, 700);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full space-y-2">
      <div className="flex justify-between w-56 mx-auto text-lg font-bold">
        <div className="text-blue-500">P1: {positions[0]}</div>
        <div className="text-red-500">P2: {positions[1]}</div>
      </div>
      {/* Ludo board visualization */}
      <div className="flex flex-col items-center my-4">
        <div className="flex space-x-1">
          {Array.from({ length: 21 }).map((_, i) => (
            <div key={i} className={`w-6 h-6 border rounded flex items-center justify-center text-xs font-bold
              ${positions[0] === i && positions[1] === i ? 'bg-purple-400' :
                positions[0] === i ? 'bg-blue-400' :
                positions[1] === i ? 'bg-red-400' :
                'bg-slate-200'}
            `}>
              {i}
            </div>
          ))}
        </div>
        <div className="flex justify-between w-full mt-1 text-xs">
          <span className="text-blue-400">Start</span>
          <span className="text-red-400">Finish</span>
        </div>
      </div>
      <div className="flex justify-center">
        <button className="bg-yellow-400 px-4 py-2 rounded shadow-lg hover:bg-yellow-500 transition" onClick={rollDice} disabled={playMode === 'player' ? !isMyTurn : turn !== 0}>Roll Dice</button>
      </div>
      {dice && <div className="text-center text-lg">Dice: {dice}</div>}
      <div className="text-center mt-2 font-bold text-xl">
        {positions[0] >= 20 ? 'Player 1 Wins!' : positions[1] >= 20 ? 'Player 2 Wins!' : ''}
      </div>
      {(positions[0] >= 20 || positions[1] >= 20) && (
        <button
          className="mt-2 bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
          onClick={() => {
            setPositions(initialPositions);
            setTurn(0);
            setDice(null);
          }}
        >Replay</button>
      )}
    </div>
  );
}
