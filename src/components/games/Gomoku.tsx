// Gomoku game logic for two players (simplified demo)
import { useEffect, useState } from 'react';

const SIZE = 10;
const initialBoard = Array.from({ length: SIZE }, () => Array(SIZE).fill(''));

function getNextTurn(turn: string) {
  return turn === 'X' ? 'O' : 'X';
}

function checkWinner(board: string[][]) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const player = board[r][c];
      if (!player) continue;
      // Horizontal
      if (c + 4 < SIZE && Array.from({length:5}).every((_,i)=>board[r][c+i]===player)) return player;
      // Vertical
      if (r + 4 < SIZE && Array.from({length:5}).every((_,i)=>board[r+i][c]===player)) return player;
      // Diagonal \
      if (r + 4 < SIZE && c + 4 < SIZE && Array.from({length:5}).every((_,i)=>board[r+i][c+i]===player)) return player;
      // Diagonal /
      if (r - 4 >= 0 && c + 4 < SIZE && Array.from({length:5}).every((_,i)=>board[r-i][c+i]===player)) return player;
    }
  }
  return null;
}

export function Gomoku({ roomName, user, isMyTurn, playMode }: { roomName: string, user: any, isMyTurn: boolean, playMode: 'player' | 'computer' }) {
  const [board, setBoard] = useState(initialBoard);
  const [turn, setTurn] = useState('X');
  const [winner, setWinner] = useState<string|null>(null);

  useEffect(() => {
    if (playMode === 'player') {
      // Firebase logic removed
    } else {
      setBoard(initialBoard);
      setTurn('X');
    }
  }, [roomName, playMode]);

  useEffect(() => {
    const win = checkWinner(board);
    if (win) setWinner(win);
    if (playMode === 'computer' && turn === 'O' && !win) {
      setTimeout(() => {
        // Computer move: pick random empty cell
        const empty: [number, number][] = [];
        for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (!board[r][c]) empty.push([r, c]);
        if (empty.length) {
          const [row, col] = empty[Math.floor(Math.random() * empty.length)];
          const newBoard = board.map(arr => [...arr]);
          newBoard[row][col] = 'O';
          setBoard(newBoard);
          setTurn('X');
        }
      }, 600);
    }
  }, [board, turn, playMode]);

  function handleCellClick(row: number, col: number) {
    if (winner) return;
    if (playMode === 'player') {
      if (!isMyTurn || board[row][col]) return;
      const newBoard = board.map(arr => [...arr]);
      newBoard[row][col] = turn;
      // Firebase logic removed
    } else {
      if (turn !== 'X' || board[row][col]) return;
      const newBoard = board.map(arr => [...arr]);
      newBoard[row][col] = 'X';
      setBoard(newBoard);
      setTurn('O');
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div className="grid grid-cols-10 w-[28rem] border-4 border-yellow-400 rounded-lg shadow-xl bg-gradient-to-br from-slate-900 to-slate-700 mb-2">
        {board.map((rowArr, row) =>
          rowArr.map((cell, col) => (
            <div
              key={row + '-' + col}
              className={`aspect-square w-10 h-10 flex items-center justify-center text-xl cursor-pointer border font-bold ${cell ? 'text-yellow-500' : 'text-slate-400'}`}
              onClick={() => handleCellClick(row, col)}
            >
              {cell}
            </div>
          ))
        )}
      </div>
      {winner && <div className="text-green-500 font-bold text-lg">Winner: {winner}</div>}
    </div>
  );
}
