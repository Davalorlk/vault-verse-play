// Dot and Box game logic for two players (simplified demo)
import { useEffect, useState } from 'react';

const ROWS = 12; // 12 rows of boxes
const COLS = 15; // 15 columns of boxes
const initialLines = Array(ROWS+1).fill(0).map(() => Array(COLS).fill(false)).concat(Array(ROWS).fill(0).map(() => Array(COLS+1).fill(false)));
const initialBoxes = Array(ROWS).fill(0).map(() => Array(COLS).fill(''));

function getNextTurn(turn: number) {
  return turn === 0 ? 1 : 0;
}

// Dots and Boxes helpers
function getCompletedBoxes(lines: boolean[][], rows: number, cols: number) {
  const boxes = Array(rows).fill(0).map(() => Array(cols).fill(''));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (
        lines[i][j] && // top
        lines[rows+1+i][j] && // left
        lines[i+1][j] && // bottom
        lines[rows+1+i][j+1] // right
      ) {
        boxes[i][j] = 'claimed';
      }
    }
  }
  return boxes;
}

// Smarter Dots and Boxes AI: prefer moves that complete a box, avoid giving boxes
function getBestDotAndBoxMove(lines: boolean[][], boxes: any[][], turn: number, rows: number, cols: number) {
  // 1. Try to complete a box
  for (let i = 0; i < rows+1; i++) for (let j = 0; j < cols; j++) {
    if (!lines[i][j]) {
      // Simulate move
      const newLines = lines.map(arr => [...arr]);
      newLines[i][j] = true;
      let completed = false;
      for (let x = 0; x < rows; x++) for (let y = 0; y < cols; y++) {
        if (!boxes[x][y] &&
          newLines[x][y] && newLines[x+1][y] && newLines[rows+1+x][y] && newLines[rows+1+x][y+1]) {
          completed = true;
        }
      }
      if (completed) return ['h', i, j];
    }
  }
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols+1; j++) {
    if (!lines[rows+1+i][j]) {
      const newLines = lines.map(arr => [...arr]);
      newLines[rows+1+i][j] = true;
      let completed = false;
      for (let x = 0; x < rows; x++) for (let y = 0; y < cols; y++) {
        if (!boxes[x][y] &&
          newLines[x][y] && newLines[x+1][y] && newLines[rows+1+x][y] && newLines[rows+1+x][y+1]) {
          completed = true;
        }
      }
      if (completed) return ['v', i, j];
    }
  }
  // 2. Otherwise, pick a move that does NOT give a box if possible
  for (let i = 0; i < rows+1; i++) for (let j = 0; j < cols; j++) {
    if (!lines[i][j]) {
      const newLines = lines.map(arr => [...arr]);
      newLines[i][j] = true;
      let givesBox = false;
      for (let x = 0; x < rows; x++) for (let y = 0; y < cols; y++) {
        if (!boxes[x][y]) {
          let count = 0;
          if (newLines[x][y]) count++;
          if (newLines[x+1][y]) count++;
          if (newLines[rows+1+x][y]) count++;
          if (newLines[rows+1+x][y+1]) count++;
          if (count === 4) givesBox = true;
        }
      }
      if (!givesBox) return ['h', i, j];
    }
  }
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols+1; j++) {
    if (!lines[rows+1+i][j]) {
      const newLines = lines.map(arr => [...arr]);
      newLines[rows+1+i][j] = true;
      let givesBox = false;
      for (let x = 0; x < rows; x++) for (let y = 0; y < cols; y++) {
        if (!boxes[x][y]) {
          let count = 0;
          if (newLines[x][y]) count++;
          if (newLines[x+1][y]) count++;
          if (newLines[rows+1+x][y]) count++;
          if (newLines[rows+1+x][y+1]) count++;
          if (count === 4) givesBox = true;
        }
      }
      if (!givesBox) return ['v', i, j];
    }
  }
  // 3. Otherwise, pick any available move
  for (let i = 0; i < rows+1; i++) for (let j = 0; j < cols; j++) if (!lines[i][j]) return ['h', i, j];
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols+1; j++) if (!lines[rows+1+i][j]) return ['v', i, j];
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
    for (let i = 0; i < ROWS; i++) for (let j = 0; j < COLS; j++) {
      if (boxes[i][j] === 0) continue;
      if (boxes[i][j] === 1) p0++;
      if (boxes[i][j] === 2) p1++;
    }
    setScores([p0, p1]);
    if (p0 + p1 === ROWS * COLS) setWinner(p0 > p1 ? 'Player 1' : p1 > p0 ? 'Player 2' : 'Draw');
  }, [boxes]);

  useEffect(() => {
    // Smarter computer move for Dots and Boxes
    if (playMode === 'computer' && turn === 1 && winner === null) {
      setTimeout(() => {
        const move = getBestDotAndBoxMove(lines, boxes, 1, ROWS, COLS);
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
    else newLines[ROWS+1+i][j] = true;
    const newBoxes = getCompletedBoxes(newLines, ROWS, COLS);
    let newTurn = getNextTurn(turn);
    let boxClaimed = false;
    for (let x = 0; x < ROWS; x++) for (let y = 0; y < COLS; y++) {
      if (newBoxes[x][y] === 'claimed' && boxes[x][y] !== 'claimed') {
        boxClaimed = true;
      }
    }
    setLines(newLines);
    setBoxes(newBoxes);
    if (!boxClaimed) {
      setTurn(newTurn);
    }
  }

  return (
    <div>
      <div>Scores: Player 1 - {scores[0]} | Player 2 - {scores[1]}</div>
      {winner && <div className="text-xl font-bold text-yellow-400 mb-2">{winner}!</div>}
      <div className="inline-block bg-gradient-to-br from-slate-900 to-slate-700 p-4 rounded-lg shadow-xl border-4 border-yellow-400">
        <div
          style={{
            display: 'grid',
            gridTemplateRows: `repeat(${ROWS * 2 + 1}, 20px)`,
            gridTemplateColumns: `repeat(${COLS * 2 + 1}, 20px)`
          }}
        >
          {Array.from({ length: ROWS * 2 + 1 }).map((_, row) =>
            Array.from({ length: COLS * 2 + 1 }).map((_, col) => {
              // Dots
              if (row % 2 === 0 && col % 2 === 0) {
                return (
                  <div
                    key={`dot-${row}-${col}`}
                    style={{ width: 8, height: 8, borderRadius: 4, background: '#fff', margin: 'auto' }}
                  />
                );
              }
              // Horizontal lines
              if (row % 2 === 0 && col % 2 === 1 && row / 2 < initialLines.length && (col - 1) / 2 < initialLines[0].length) {
                const i = row / 2;
                const j = (col - 1) / 2;
                const filled = lines[i][j];
                return (
                  <div
                    key={`hline-${i}-${j}`}
                    onClick={() => handleLineClick('h', i, j)}
                    style={{
                      height: 6,
                      width: 20,
                      background: filled ? '#facc15' : '#444',
                      margin: 'auto',
                      borderRadius: 3,
                      cursor: filled ? 'default' : 'pointer',
                      transition: 'background 0.2s'
                    }}
                  />
                );
              }
              // Vertical lines
              if (row % 2 === 1 && col % 2 === 0 && (row - 1) / 2 < initialLines.length - ROWS - 1 && col / 2 < initialLines[0].length) {
                const i = (row - 1) / 2;
                const j = col / 2;
                const filled = lines[ROWS + 1 + i][j];
                return (
                  <div
                    key={`vline-${i}-${j}`}
                    onClick={() => handleLineClick('v', i, j)}
                    style={{
                      width: 6,
                      height: 20,
                      background: filled ? '#facc15' : '#444',
                      margin: 'auto',
                      borderRadius: 3,
                      cursor: filled ? 'default' : 'pointer',
                      transition: 'background 0.2s'
                    }}
                  />
                );
              }
              // Boxes
              if (row % 2 === 1 && col % 2 === 1 && (row - 1) / 2 < boxes.length && (col - 1) / 2 < boxes[0].length) {
                const i = (row - 1) / 2;
                const j = (col - 1) / 2;
                const claimed = boxes[i][j] === 'claimed';
                return (
                  <div
                    key={`box-${i}-${j}`}
                    style={{
                      width: 20,
                      height: 20,
                      background: claimed ? (playMode === 'player' ? '#60a5fa' : '#34d399') : 'transparent',
                      margin: 'auto',
                      borderRadius: 2,
                      transition: 'background 0.2s'
                    }}
                  />
                );
              }
              // Empty cell
              return <div key={`empty-${row}-${col}`} />;
            })
          )}
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
          }}
        >Replay</button>
      )}
    </div>
  );
}
