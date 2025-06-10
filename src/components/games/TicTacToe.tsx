// Tic Tac Toe game logic for two players
import { useEffect, useState } from 'react';
import { socket } from '@/lib/socket';

const initialBoard = [
  ['', '', ''],
  ['', '', ''],
  ['', '', '']
];

function getNextTurn(turn: string) {
  return turn === 'X' ? 'O' : 'X';
}

function checkWinner(board: string[][]) {
  for (let i = 0; i < 3; i++) {
    if (board[i][0] && board[i][0] === board[i][1] && board[i][1] === board[i][2]) return board[i][0];
    if (board[0][i] && board[0][i] === board[1][i] && board[1][i] === board[2][i]) return board[0][i];
  }
  if (board[0][0] && board[0][0] === board[1][1] && board[1][1] === board[2][2]) return board[0][0];
  if (board[0][2] && board[0][2] === board[1][1] && board[1][1] === board[2][0]) return board[0][2];
  return null;
}

// --- Smarter Tic Tac Toe AI: minimax ---
function minimaxTicTacToe(board: string[][], turn: string): {score: number, move: [number, number]|null} {
  const winner = checkWinner(board);
  if (winner === 'X') return { score: 1, move: null };
  if (winner === 'O') return { score: -1, move: null };
  if (board.flat().every(cell => cell)) return { score: 0, move: null };
  let bestScore = turn === 'X' ? -Infinity : Infinity;
  let bestMove: [number, number]|null = null;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    if (!board[r][c]) {
      board[r][c] = turn;
      const result = minimaxTicTacToe(board, turn === 'X' ? 'O' : 'X');
      board[r][c] = '';
      if (turn === 'X' ? result.score > bestScore : result.score < bestScore) {
        bestScore = result.score;
        bestMove = [r, c];
      }
    }
  }
  return { score: bestScore, move: bestMove };
}

export function TicTacToe({ roomName, user, isMyTurn, playMode }: { roomName: string, user: any, isMyTurn: boolean, playMode: 'player' | 'computer' }) {
  const [board, setBoard] = useState(initialBoard);
  const [turn, setTurn] = useState('X');
  const [winner, setWinner] = useState<string|null>(null);

  useEffect(() => {
    if (playMode === 'player') {
      socket.emit('join-game-room', { roomName, gameId: 'tictactoe' });
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
      setTurn('X');
    }
  }, [roomName, playMode]);

  useEffect(() => {
    if (playMode === 'player') {
      socket.emit('game-state-update', {
        roomName,
        gameId: 'tictactoe',
        state: { board, turn }
      });
    }
  }, [board, turn, playMode, roomName]);

  useEffect(() => {
    const win = checkWinner(board);
    if (win) setWinner(win);
    if (playMode === 'computer' && turn === 'O' && !win) {
      setTimeout(() => {
        const { move } = minimaxTicTacToe(board, 'O');
        if (move) {
          const newBoard = board.map(arr => [...arr]);
          newBoard[move[0]][move[1]] = 'O';
          setBoard(newBoard);
          setTurn('X');
        }
      }, 500);
    }
  }, [board, turn, playMode]);

  function handleCellClick(row: number, col: number) {
    if (winner) return;
    if (playMode === 'player') {
      if (!isMyTurn || board[row][col]) return;
      const newBoard = board.map(arr => [...arr]);
      newBoard[row][col] = turn;
      setBoard(newBoard);
      setTurn(getNextTurn(turn));
      // Socket emit handled by useEffect
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
      <div className="grid grid-cols-3 w-44 border-4 border-yellow-400 rounded-lg shadow-xl bg-gradient-to-br from-slate-900 to-slate-700 mb-2">
        {board.map((rowArr, row) =>
          rowArr.map((cell, col) => (
            <div
              key={row + '-' + col}
              className={`aspect-square w-14 h-14 flex items-center justify-center text-3xl cursor-pointer border font-bold ${cell ? 'text-yellow-500' : 'text-slate-400'}`}
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
