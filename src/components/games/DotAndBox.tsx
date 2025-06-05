// Dot and Box game logic for two players, with real-time state sync via Firebase (simplified demo)
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, set } from 'firebase/database';

const SIZE = 3; // 3x3 boxes
const initialLines = Array(SIZE+1).fill(0).map(() => Array(SIZE).fill(false)).concat(Array(SIZE).fill(0).map(() => Array(SIZE+1).fill(false)));
const initialBoxes = Array(SIZE).fill(0).map(() => Array(SIZE).fill(''));

function getNextTurn(turn: number) {
  return turn === 0 ? 1 : 0;
}

// Dots and Boxes helpers
function getCompletedBoxes(lines: boolean[][], size: number) {
  const boxes = Array(size).fill(0).map(() => Array(size).fill(''));
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (
        lines[i][j] && // top
        lines[size+1+i][j] && // left
        lines[i+1][j] && // bottom
        lines[size+1+i][j+1] // right
      ) {
        boxes[i][j] = 'claimed';
      }
    }
  }
  return boxes;
}

// Smarter Dots and Boxes AI: prefer moves that complete a box, avoid giving boxes
function getBestDotAndBoxMove(lines: boolean[][], boxes: any[][], turn: number, size: number) {
  // 1. Try to complete a box
  for (let i = 0; i < size+1; i++) for (let j = 0; j < size; j++) {
    if (!lines[i][j]) {
      // Simulate move
      const newLines = lines.map(arr => [...arr]);
      newLines[i][j] = true;
      let completed = false;
      for (let x = 0; x < size; x++) for (let y = 0; y < size; y++) {
        if (!boxes[x][y] &&
          newLines[x][y] && newLines[x+1][y] && newLines[size+1+x][y] && newLines[size+1+x][y+1]) {
          completed = true;
        }
      }
      if (completed) return ['h', i, j];
    }
  }
  for (let i = 0; i < size; i++) for (let j = 0; j < size+1; j++) {
    if (!lines[size+1+i][j]) {
      const newLines = lines.map(arr => [...arr]);
      newLines[size+1+i][j] = true;
      let completed = false;
      for (let x = 0; x < size; x++) for (let y = 0; y < size; y++) {
        if (!boxes[x][y] &&
          newLines[x][y] && newLines[x+1][y] && newLines[size+1+x][y] && newLines[size+1+x][y+1]) {
          completed = true;
        }
      }
      if (completed) return ['v', i, j];
    }
  }
  // 2. Otherwise, pick a move that does NOT give a box if possible
  for (let i = 0; i < size+1; i++) for (let j = 0; j < size; j++) {
    if (!lines[i][j]) {
      const newLines = lines.map(arr => [...arr]);
      newLines[i][j] = true;
      let givesBox = false;
      for (let x = 0; x < size; x++) for (let y = 0; y < size; y++) {
        if (!boxes[x][y]) {
          let count = 0;
          if (newLines[x][y]) count++;
          if (newLines[x+1][y]) count++;
          if (newLines[size+1+x][y]) count++;
          if (newLines[size+1+x][y+1]) count++;
          if (count === 4) givesBox = true;
        }
      }
      if (!givesBox) return ['h', i, j];
    }
  }
  for (let i = 0; i < size; i++) for (let j = 0; j < size+1; j++) {
    if (!lines[size+1+i][j]) {
      const newLines = lines.map(arr => [...arr]);
      newLines[size+1+i][j] = true;
      let givesBox = false;
      for (let x = 0; x < size; x++) for (let y = 0; y < size; y++) {
        if (!boxes[x][y]) {
          let count = 0;
          if (newLines[x][y]) count++;
          if (newLines[x+1][y]) count++;
          if (newLines[size+1+x][y]) count++;
          if (newLines[size+1+x][y+1]) count++;
          if (count === 4) givesBox = true;
        }
      }
      if (!givesBox) return ['v', i, j];
    }
  }
  // 3. Otherwise, pick any available move
  for (let i = 0; i < size+1; i++) for (let j = 0; j < size; j++) if (!lines[i][j]) return ['h', i, j];
  for (let i = 0; i < size; i++) for (let j = 0; j < size+1; j++) if (!lines[size+1+i][j]) return ['v', i, j];
  return null;
}

export function DotAndBox({ roomName, user, isMyTurn, playMode }: { roomName: string, user: any, isMyTurn: boolean, playMode: 'player' | 'computer' }) {
  const [lines, setLines] = useState(initialLines);
  const [boxes, setBoxes] = useState(initialBoxes);
  const [turn, setTurn] = useState(0);
  const [scores, setScores] = useState([0, 0]);
  const [lastBoxClaimed, setLastBoxClaimed] = useState(false);
  const [winner, setWinner] = useState<string|null>(null);

  useEffect(() => {
    if (playMode === 'player') {
      const linesRef = ref(db, `rooms/${roomName}/games/dotandbox/lines`);
      const boxesRef = ref(db, `rooms/${roomName}/games/dotandbox/boxes`);
      const turnRef = ref(db, `rooms/${roomName}/games/dotandbox/turn`);
      onValue(linesRef, snap => { if (snap.exists()) setLines(snap.val()); });
      onValue(boxesRef, snap => { if (snap.exists()) setBoxes(snap.val()); });
      onValue(turnRef, snap => { if (snap.exists()) setTurn(snap.val()); });
    } else {
      setLines(initialLines);
      setBoxes(initialBoxes);
      setTurn(0);
    }
  }, [roomName, playMode]);

  useEffect(() => {
    // Calculate scores and winner
    let p0 = 0, p1 = 0;
    for (let i = 0; i < SIZE; i++) for (let j = 0; j < SIZE; j++) {
      if (boxes[i][j] === 0) continue;
      if (boxes[i][j] === 1) p0++;
      if (boxes[i][j] === 2) p1++;
    }
    setScores([p0, p1]);
    if (p0 + p1 === SIZE * SIZE) setWinner(p0 > p1 ? 'Player 1' : p1 > p0 ? 'Player 2' : 'Draw');
  }, [boxes]);

  useEffect(() => {
    // Smarter computer move for Dots and Boxes
    if (playMode === 'computer' && turn === 1 && winner === null) {
      setTimeout(() => {
        const move = getBestDotAndBoxMove(lines, boxes, 1, SIZE);
        if (move) {
          handleLineClick(move[0] as 'h' | 'v', move[1] as number, move[2] as number);
        }
      }, 700);
    }
  }, [lines, boxes, turn, playMode, winner]);

  function handleLineClick(type: 'h'|'v', i: number, j: number) {
    if (!isMyTurn && playMode === 'player') return;
    if (winner !== null) return;
    const newLines = lines.map(arr => [...arr]);
    if (type === 'h') newLines[i][j] = true;
    else newLines[SIZE+1+i][j] = true;
    const newBoxes = getCompletedBoxes(newLines, SIZE);
    let newTurn = getNextTurn(turn);
    let boxClaimed = false;
    for (let x = 0; x < SIZE; x++) for (let y = 0; y < SIZE; y++) {
      if (newBoxes[x][y] === 'claimed' && boxes[x][y] !== 'claimed') {
        boxClaimed = true;
        if (playMode === 'player') {
          set(ref(db, `rooms/${roomName}/games/dotandbox/boxes/${x}/${y}`), 1);
          set(ref(db, `rooms/${roomName}/games/dotandbox/turn`), newTurn);
        } else {
          set(ref(db, `rooms/${roomName}/games/dotandbox/boxes/${x}/${y}`), 2);
          set(ref(db, `rooms/${roomName}/games/dotandbox/turn`), newTurn);
        }
      }
    }
    setLines(newLines);
    setBoxes(newBoxes);
    if (!boxClaimed) {
      setTurn(newTurn);
      if (playMode === 'player') {
        set(ref(db, `rooms/${roomName}/games/dotandbox/turn`), newTurn);
      }
    }
  }

  return (
    <div>
      <div>Scores: Player 1 - {scores[0]} | Player 2 - {scores[1]}</div>
      {winner && <div className="text-xl font-bold text-yellow-400 mb-2">{winner}!</div>}
      <div className="inline-block bg-gradient-to-br from-slate-900 to-slate-700 p-4 rounded-lg shadow-xl border-4 border-yellow-400">
        <div style={{ display: 'grid', gridTemplateRows: `repeat(${SIZE+1}, 1fr)`, gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>
          {lines.map((row, i) => row.map((line, j) => (
            <div key={`${i}-${j}`} onClick={() => handleLineClick(i < SIZE ? 'h' : 'v', i < SIZE ? i : i-SIZE, j)} style={{ 
              borderTop: i < SIZE ? 'none' : '2px solid black', 
              borderLeft: j === 0 ? 'none' : '2px solid black',
              cursor: line ? 'default' : 'pointer'
            }}></div>
          )))}
        </div>
        <div style={{ display: 'grid', gridTemplateRows: `repeat(${SIZE}, 1fr)`, gridTemplateColumns: `repeat(${SIZE+1}, 1fr)` }}>
          {boxes.map((row, i) => row.map((box, j) => (
            <div key={`${i}-${j}`} style={{ 
              borderTop: '2px solid black', 
              borderLeft: '2px solid black',
              backgroundColor: box === 'claimed' ? (playMode === 'player' ? 'lightblue' : 'lightgreen') : 'white'
            }}></div>
          )))}
        </div>
      </div>
      {winner && (
        <button
          className="mt-2 bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
          onClick={() => {
            setLines(initialLines);
            setBoxes(initialBoxes);
            setTurn(0);
            setScores([0,0]);
            setWinner(null);
            if (playMode === 'player') {
              set(ref(db, `rooms/${roomName}/games/dotandbox/lines`), initialLines);
              set(ref(db, `rooms/${roomName}/games/dotandbox/boxes`), initialBoxes);
              set(ref(db, `rooms/${roomName}/games/dotandbox/turn`), 0);
            }
          }}
        >Replay</button>
      )}
    </div>
  );
}
