// Connect Four game logic for two players
import { useEffect, useState } from 'react';
import { socket } from '@/lib/socket';

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

// --- Smarter Connect Four AI: minimax search ---
function minimax(board: string[][], depth: number, maximizing: boolean, ai: string, player: string): {score: number, col: number|null} {
  const winner = checkWinner(board);
  if (winner === ai) return { score: 100, col: null };
  if (winner === player) return { score: -100, col: null };
  if (depth === 0 || board.every(row => row.every(cell => cell))) return { score: 0, col: null };
  let bestScore = maximizing ? -Infinity : Infinity;
  let bestCol = null;
  for (let c = 0; c < board[0].length; c++) {
    const row = [...board].reverse().findIndex(r => !r[c]);
    if (row === -1) continue;
    const newBoard = board.map(arr => [...arr]);
    newBoard[board.length - 1 - row][c] = maximizing ? ai : player;
    const result = minimax(newBoard, depth - 1, !maximizing, ai, player);
    if (maximizing ? result.score > bestScore : result.score < bestScore) {
      bestScore = result.score;
      bestCol = c;
    }
  }
  return { score: bestScore, col: bestCol };
}
function getBestMove(board: string[][], ai: string, player: string) {
  return minimax(board, 4, true, ai, player).col;
}

export function ConnectFour({ roomName, user, isMyTurn, playMode }: { roomName: string, user: any, isMyTurn: boolean, playMode: 'player' | 'computer' }) {
  const [board, setBoard] = useState(initialBoard);
  const [turn, setTurn] = useState('R');
  const [winner, setWinner] = useState<string|null>(null);

  // Real-time sync for PvP
  useEffect(() => {
    if (playMode === 'player') {
      socket.emit('join-game-room', { roomName, gameId: 'connect4' });
      const handleGameState = (state: { board: string[][], turn: string }) => {
        setBoard(state.board);
        setTurn(state.turn);
      };
      socket.on('game-state-update', handleGameState);
      return () => {
        socket.off('game-state-update', handleGameState);
      };
    } else {
      setBoard(initialBoard);
      setTurn('R');
    }
  }, [roomName, playMode]);

  // Emit game state after a move (only in multiplayer)
  useEffect(() => {
    if (playMode === 'player') {
      socket.emit('game-state-update', {
        roomName,
        gameId: 'connect4',
        state: { board, turn }
      });
    }
  }, [board, turn, playMode, roomName]);

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
      setBoard(newBoard);
      setTurn(getNextTurn(turn));
      // Socket emit handled by useEffect
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
