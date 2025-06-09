// Connect Four game logic for two players
import { useEffect, useState } from 'react';

const ROWS = 6;
const COLS = 7;
const initialBoard = Array.from({ length: ROWS }, () => Array(COLS).fill(''));

function getNextTurn(turn: string) {
  return turn === 'R' ? 'Y' : 'R';
}

function checkWinner(board: string[][]) {
  // Horizontal, vertical, diagonal checks
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const player = board[r][c];
      if (!player) continue;
      // Horizontal
      if (c + 3 < COLS && player === board[r][c+1] && player === board[r][c+2] && player === board[r][c+3]) return player;
      // Vertical
      if (r + 3 < ROWS && player === board[r+1][c] && player === board[r+2][c] && player === board[r+3][c]) return player;
      // Diagonal /
      if (r - 3 >= 0 && c + 3 < COLS && player === board[r-1][c+1] && player === board[r-2][c+2] && player === board[r-3][c+3]) return player;
      // Diagonal \
      if (r + 3 < ROWS && c + 3 < COLS && player === board[r+1][c+1] && player === board[r+2][c+2] && player === board[r+3][c+3]) return player;
    }
  }
  return null;
}

// Minimax AI for Connect Four
function minimax(board: string[][], depth: number, maximizing: boolean, ai: string, player: string): {score: number, col: number|null} {
  const win = checkWinner(board);
  if (win === ai) return { score: 100 - depth, col: null };
  if (win === player) return { score: depth - 100, col: null };
  if (depth === 0) return { score: 0, col: null };
  const available = [];
  for (let c = 0; c < COLS; c++) if (!board[0][c]) available.push(c);
  if (available.length === 0) return { score: 0, col: null };
  if (maximizing) {
    let maxEval = -Infinity, bestCol = available[0];
    for (const col of available) {
      const row = [...Array(ROWS).keys()].reverse().find(r => !board[r][col]);
      if (row === undefined) continue;
      const newBoard = board.map(arr => [...arr]);
      newBoard[row][col] = ai;
      const evalResult = minimax(newBoard, depth - 1, false, ai, player).score;
      if (evalResult > maxEval) { maxEval = evalResult; bestCol = col; }
    }
    return { score: maxEval, col: bestCol };
  } else {
    let minEval = Infinity, bestCol = available[0];
    for (const col of available) {
      const row = [...Array(ROWS).keys()].reverse().find(r => !board[r][col]);
      if (row === undefined) continue;
      const newBoard = board.map(arr => [...arr]);
      newBoard[row][col] = player;
      const evalResult = minimax(newBoard, depth - 1, true, ai, player).score;
      if (evalResult < minEval) { minEval = evalResult; bestCol = col; }
    }
    return { score: minEval, col: bestCol };
  }
}

function getBestMove(board: string[][], ai: string, player: string) {
  // Use minimax with depth 4 for reasonable performance
  return minimax(board, 4, true, ai, player).col;
}

export function ConnectFour({ roomName, user, isMyTurn, playMode }: { roomName: string, user: any, isMyTurn: boolean, playMode: 'player' | 'computer' }) {
  const [board, setBoard] = useState(initialBoard);
  const [turn, setTurn] = useState('R');
  const [winner, setWinner] = useState<string|null>(null);

  useEffect(() => {
    if (playMode === 'player') {
      // Use Socket.IO for real-time updates
      // Example: Listen for board updates from server
      // socket.on('connect-four-update', (newBoard, newTurn) => {
      //   setBoard(newBoard);
      //   setTurn(newTurn);
      // });
      // return () => socket.off('connect-four-update');
    } else {
      setBoard(initialBoard);
      setTurn('R');
    }
  }, [playMode]);

  useEffect(() => {
    const win = checkWinner(board);
    if (win) setWinner(win);
    if (playMode === 'computer' && turn === 'Y' && !win) {
      setTimeout(() => {
        const col = getBestMove(board, 'Y', 'R');
        if (col !== null) {
          const row = [...Array(ROWS).keys()].reverse().find(r => !board[r][col]);
          if (row !== undefined) {
            const newBoard = board.map(arr => [...arr]);
            newBoard[row][col] = 'Y';
            // Update local state for computer move
            setBoard(newBoard);
            setTurn('R');
          }
        }
      }, 600);
    }
  }, [board, turn, playMode]);

  function handleColumnClick(col: number) {
    if (winner) return;
    if (playMode === 'player') {
      if (!isMyTurn) return;
      const row = [...Array(ROWS).keys()].reverse().find(r => !board[r][col]);
      if (row === undefined) return;
      const newBoard = board.map(arr => [...arr]);
      newBoard[row][col] = turn;
      // TODO: Replace with Socket.IO emit for player move
    } else {
      if (turn !== 'R') return;
      const row = [...Array(ROWS).keys()].reverse().find(r => !board[r][col]);
      if (row === undefined) return;
      const newBoard = board.map(arr => [...arr]);
      newBoard[row][col] = 'R';
      setBoard(newBoard);
      setTurn('Y');
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      {winner && <div className="text-xl font-bold text-yellow-400 mb-2">{winner} wins!</div>}
      <div className="grid grid-cols-7 w-72 border-4 border-yellow-400 rounded-lg shadow-xl bg-gradient-to-br from-slate-900 to-slate-700 mb-2">
        {Array.from({ length: COLS }).map((_, col) => (
          <button key={col} className="h-6 bg-yellow-200" onClick={() => handleColumnClick(col)} disabled={!!winner}>▼</button>
        ))}
        {board.map((rowArr, row) =>
          rowArr.map((cell, col) => (
            <div
              key={row + '-' + col}
              className={`aspect-square w-10 h-10 flex items-center justify-center text-2xl border font-bold ${cell === 'R' ? 'text-red-500' : cell === 'Y' ? 'text-yellow-500' : 'text-slate-400'}`}
            >
              {cell ? '●' : ''}
            </div>
          ))
        )}
      </div>
      {winner && (
        <button
          className="mt-2 bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
          onClick={() => {
            setBoard(initialBoard);
            setTurn('R');
            setWinner(null);
            if (playMode === 'player') {
              // TODO: Replace with Socket.IO emit to reset game
            }
          }}
        >Replay</button>
      )}
    </div>
  );
}
