// Dot and Box game logic for two players (simplified demo)
import { useEffect, useState } from 'react';
import { socket } from '@/lib/socket';

const ROWS = 7; // 7 rows of boxes
const COLS = 7; // 7 columns of boxes
const initialLines = Array(ROWS+1).fill(0).map(() => Array(COLS).fill(false)).concat(Array(ROWS).fill(0).map(() => Array(COLS+1).fill(false)));
const initialBoxes = Array(ROWS).fill(0).map(() => Array(COLS).fill(0));

function getNextTurn(turn: number) {
  return turn === 0 ? 1 : 0;
}

// Dots and Boxes helpers
// Now track which player claimed each box: 1 for Player 1, 2 for Player 2
function getCompletedBoxes(lines: boolean[][], prevBoxes: number[][], turn: number, rows: number, cols: number) {
  const boxes = prevBoxes.map(row => [...row]);
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (
        lines[i][j] && // top
        lines[rows+1+i][j] && // left
        lines[i+1][j] && // bottom
        lines[rows+1+i][j+1] // right
      ) {
        if (!boxes[i][j]) boxes[i][j] = turn + 1; // 1 for Player 1, 2 for Player 2
      }
    }
  }
  return boxes;
}

// --- Smarter Dot and Box AI: complete box, avoid giving box, random ---
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
      socket.emit('join-game-room', { roomName, gameId: 'dotandbox' });
      const handleGameState = (state: { lines: boolean[][], boxes: any[][], turn: number }) => {
        setLines(state.lines);
        setBoxes(state.boxes);
        setTurn(state.turn);
      };
      socket.on('game-state-update', handleGameState);
      return () => {
        socket.off('game-state-update', handleGameState);
      };
    } else {
      setLines(initialLines);
      setBoxes(initialBoxes);
      setTurn(0);
    }
  }, [roomName, playMode]);

  useEffect(() => {
    if (playMode === 'player') {
      socket.emit('game-state-update', {
        roomName,
        gameId: 'dotandbox',
        state: { lines, boxes, turn }
      });
    }
  }, [lines, boxes, turn, playMode, roomName]);

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
    if (winner !== null) return;
    if (playMode === 'player') {
      if (!isMyTurn) return;
      const newLines = lines.map(arr => [...arr]);
      if (type === 'h') newLines[i][j] = true;
      else newLines[ROWS+1+i][j] = true;
      const newBoxes = getCompletedBoxes(newLines, boxes, turn, ROWS, COLS);
      let newTurn = getNextTurn(turn);
      let boxClaimed = false;
      for (let x = 0; x < ROWS; x++) for (let y = 0; y < COLS; y++) {
        if (newBoxes[x][y] !== boxes[x][y] && newBoxes[x][y] !== 0) {
          boxClaimed = true;
        }
      }
      setLines(newLines);
      setBoxes(newBoxes);
      if (!boxClaimed) {
        setTurn(newTurn);
      }
      // Socket emit handled by useEffect
    } else {
      if (!isMyTurn) return;
      const newLines = lines.map(arr => [...arr]);
      if (type === 'h') newLines[i][j] = true;
      else newLines[ROWS+1+i][j] = true;
      const newBoxes = getCompletedBoxes(newLines, boxes, turn, ROWS, COLS);
      let newTurn = getNextTurn(turn);
      let boxClaimed = false;
      for (let x = 0; x < ROWS; x++) for (let y = 0; y < COLS; y++) {
        if (newBoxes[x][y] !== boxes[x][y] && newBoxes[x][y] !== 0) {
          boxClaimed = true;
        }
      }
      setLines(newLines);
      setBoxes(newBoxes);
      if (!boxClaimed) {
        setTurn(newTurn);
      }
    }
  }

  return (
    <div>
      <h1>Dot and Box Game</h1>
      <div>Room: {roomName}</div>
      <div>{`Player 1 (You): ${scores[0]} | Player 2 (Opponent): ${scores[1]}`}</div>
      {winner !== null && <div className="winner">{`Winner: ${winner}`}</div>}
      <div className="grid">
        {lines.map((row, i) => (
          <div key={i} className="row">
            {row.map((line, j) => (
              <div key={j} className="cell">
                {i < ROWS && j < COLS && (
                  <div
                    className={`box ${boxes[i][j] === 1 ? 'claimed-by-player-1' : boxes[i][j] === 2 ? 'claimed-by-player-2' : ''}`}
                    style={{ opacity: boxes[i][j] !== 0 ? 1 : 0.2 }}
                  />
                )}
                {i === ROWS && j < COLS && (
                  <div
                    className={`dot ${line ? 'connected' : ''}`}
                    onClick={() => handleLineClick('h', i, j)}
                  />
                )}
                {i < ROWS && j === COLS && (
                  <div
                    className={`dot ${line ? 'connected' : ''}`}
                    onClick={() => handleLineClick('v', i, j)}
                  />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      {winner === null && <div>{isMyTurn ? 'Your turn' : 'Opponent\'s turn'}</div>}
      {playMode === 'computer' && turn === 1 && <div>Computer is thinking...</div>}
    </div>
  );
}
