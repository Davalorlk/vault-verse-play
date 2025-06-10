// Nine Holes game logic for two players (simplified demo)
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

// Nine Holes helpers
function checkNineHolesWin(board: string[][]) {
  // Only horizontal and vertical wins
  for (let i = 0; i < 3; i++) {
    if (board[i][0] && board[i][0] === board[i][1] && board[i][1] === board[i][2]) return board[i][0];
    if (board[0][i] && board[0][i] === board[1][i] && board[1][i] === board[2][i]) return board[0][i];
  }
  return null;
}

// Smarter Nine Holes AI: win, block, random
function getBestNineHolesMove(board: string[][], turn: string, phase: 'placement'|'move') {
  // 1. Try to win
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    if (phase === 'placement' && !board[r][c]) {
      const newBoard = board.map(arr => [...arr]);
      newBoard[r][c] = turn;
      if (checkNineHolesWin(newBoard) === turn) return {to: [r, c]};
    }
    if (phase === 'move' && board[r][c] === turn) {
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nr = r+dr, nc = c+dc;
        if (nr>=0&&nr<3&&nc>=0&&nc<3 && !board[nr][nc]) {
          const newBoard = board.map(arr => [...arr]);
          newBoard[nr][nc] = turn;
          newBoard[r][c] = '';
          if (checkNineHolesWin(newBoard) === turn) return {from: [r, c], to: [nr, nc]};
        }
      }
    }
  }
  // 2. Block opponent win
  const opp = turn === 'X' ? 'O' : 'X';
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    if (phase === 'placement' && !board[r][c]) {
      const newBoard = board.map(arr => [...arr]);
      newBoard[r][c] = opp;
      if (checkNineHolesWin(newBoard) === opp) return {to: [r, c]};
    }
    if (phase === 'move' && board[r][c] === turn) {
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nr = r+dr, nc = c+dc;
        if (nr>=0&&nr<3&&nc>=0&&nc<3 && !board[nr][nc]) {
          const newBoard = board.map(arr => [...arr]);
          newBoard[nr][nc] = opp;
          newBoard[r][c] = '';
          if (checkNineHolesWin(newBoard) === opp) return {from: [r, c], to: [nr, nc]};
        }
      }
    }
  }
  // 3. Otherwise, pick random
  if (phase === 'placement') {
    const empty: [number, number][] = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) if (!board[r][c]) empty.push([r, c]);
    if (empty.length) return {to: empty[Math.floor(Math.random() * empty.length)]};
  } else {
    const movesList: Array<{from:[number,number],to:[number,number]}> = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      if (board[r][c] === turn) {
        for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
          const nr = r+dr, nc = c+dc;
          if (nr>=0&&nr<3&&nc>=0&&nc<3 && !board[nr][nc]) movesList.push({from:[r,c],to:[nr,nc]});
        }
      }
    }
    if (movesList.length) return movesList[Math.floor(Math.random()*movesList.length)];
  }
  return null;
}

export function NineHoles({ roomName, user, isMyTurn, playMode }: { roomName: string, user: any, isMyTurn: boolean, playMode: 'player' | 'computer' }) {
  const [board, setBoard] = useState(initialBoard);
  const [turn, setTurn] = useState('X');
  const [moves, setMoves] = useState(0);
  const [phase, setPhase] = useState<'placement'|'move'>('placement');
  const [tokens, setTokens] = useState({ X: 0, O: 0 });
  const [selected, setSelected] = useState<{row:number,col:number}|null>(null);
  const [winner, setWinner] = useState<string|null>(null);

  useEffect(() => {
    if (playMode === 'player') {
      socket.emit('join-game-room', { roomName, gameId: 'nineholes' });
      const handleGameState = (state: { board: string[][], turn: string, moves: number }) => {
        setBoard(state.board);
        setTurn(state.turn);
        setMoves(state.moves);
      };
      socket.on('game-state-update', handleGameState);
      return () => {
        socket.off('game-state-update', handleGameState);
      };
    } else {
      setBoard(initialBoard);
      setTurn('X');
      setMoves(0);
    }
  }, [roomName, playMode]);

  useEffect(() => {
    if (playMode === 'player') {
      socket.emit('game-state-update', {
        roomName,
        gameId: 'nineholes',
        state: { board, turn, moves }
      });
    }
  }, [board, turn, moves, playMode, roomName]);

  useEffect(() => {
    // Count tokens
    let x = 0, o = 0;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      if (board[r][c] === 'X') x++;
      if (board[r][c] === 'O') o++;
    }
    setTokens({ X: x, O: o });
    setPhase(x + o < 6 ? 'placement' : 'move');
    setWinner(checkNineHolesWin(board));
  }, [board]);

  function handleCellClick(row: number, col: number) {
    if (winner) return;
    if (playMode === 'player' && !isMyTurn) return;
    if (phase === 'placement') {
      if (board[row][col]) return;
      const newBoard = board.map(arr => [...arr]);
      newBoard[row][col] = turn;
      setBoard(newBoard);
      setTurn(getNextTurn(turn));
      setMoves(m => m + 1);
      // Socket emit handled by useEffect
      return;
    }
    // Move phase
    if (!selected) {
      if (board[row][col] === turn) {
        setSelected({ row, col });
      }
      return;
    } else {
      const { row: fromRow, col: fromCol } = selected;
      // Only allow orthogonal moves to empty cell
      if ((Math.abs(row - fromRow) + Math.abs(col - fromCol) === 1) && !board[row][col]) {
        const newBoard = board.map(arr => [...arr]);
        newBoard[row][col] = turn;
        newBoard[fromRow][fromCol] = '';
        setBoard(newBoard);
        setTurn(getNextTurn(turn));
        setMoves(m => m + 1);
        setSelected(null);
      } else {
        setSelected(null);
      }
    }
  }

  // Computer move effect
  useEffect(() => {
    if (playMode === 'computer' && !winner && turn === 'O') {
      setTimeout(() => {
        const move = getBestNineHolesMove(board, 'O', phase);
        if (move) {
          if (phase === 'placement' && move.to) {
            const [r, c] = move.to;
            handleCellClick(r, c);
          } else if (phase === 'move' && move.from && move.to) {
            setSelected({ row: move.from[0], col: move.from[1] });
            setTimeout(() => handleCellClick(move.to[0], move.to[1]), 200);
          }
        }
      }, 700);
    }
  }, [turn, board, phase, playMode, winner]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <div className="grid grid-cols-3 gap-1 bg-slate-200 rounded-lg p-2 shadow-lg">
        {board.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              className={`w-16 h-16 flex items-center justify-center text-3xl font-bold border-2 border-slate-400 rounded cursor-pointer select-none transition-all duration-150 ${selected && selected.row === r && selected.col === c ? 'bg-yellow-200 text-black' : cell ? 'bg-white text-black' : 'bg-blue-100 text-slate-700 hover:bg-blue-200'} ${winner ? 'opacity-60 pointer-events-none' : ''}`}
              onClick={() => handleCellClick(r, c)}
            >
              {cell}
            </div>
          ))
        )}
      </div>
      <div className="flex gap-4 mt-4">
        <div className="text-lg">Turn: <span className="font-bold">{turn}</span></div>
        <div className="text-lg">Phase: <span className="font-bold capitalize">{phase}</span></div>
      </div>
      {winner && <div className="mt-4 text-2xl text-green-700 font-bold">Winner: {winner}</div>}
      <div className="mt-4">
        <button onClick={() => {
          setBoard(initialBoard);
          setTurn('X');
          setMoves(0);
          setSelected(null);
          setWinner(null);
          if (playMode === 'player') {
            socket.emit('reset-game', { roomName, gameId: 'nineholes' });
          }
        }} className="px-4 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600 transition">
          Restart Game
        </button>
      </div>
    </div>
  );
}
