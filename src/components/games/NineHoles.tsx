// Nine Holes game logic for two players, with real-time state sync via Firebase (simplified demo)
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, set } from 'firebase/database';

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

// Smarter Nine Holes AI: prefer to win, block, then random
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
      const boardRef = ref(db, `rooms/${roomName}/games/nineholes/board`);
      const turnRef = ref(db, `rooms/${roomName}/games/nineholes/turn`);
      const movesRef = ref(db, `rooms/${roomName}/games/nineholes/moves`);
      onValue(boardRef, snap => { if (snap.exists()) setBoard(snap.val()); });
      onValue(turnRef, snap => { if (snap.exists()) setTurn(snap.val()); });
      onValue(movesRef, snap => { if (snap.exists()) setMoves(snap.val()); });
    } else {
      setBoard(initialBoard);
      setTurn('X');
      setMoves(0);
    }
  }, [roomName, playMode]);

  useEffect(() => {
    // Smarter computer move for Nine Holes
    if (playMode === 'computer' && turn === 'O' && !winner) {
      setTimeout(() => {
        const move = getBestNineHolesMove(board, 'O', phase);
        if (move) {
          if (phase === 'placement') {
            const [row, col] = move.to;
            const newBoard = board.map(arr => [...arr]);
            newBoard[row][col] = 'O';
            setBoard(newBoard);
            setTurn('X');
            setMoves(m => m + 1);
          } else if (move.from && move.to) {
            const [fr, fc] = move.from;
            const [tr, tc] = move.to;
            const newBoard = board.map(arr => [...arr]);
            newBoard[tr][tc] = 'O';
            newBoard[fr][fc] = '';
            setBoard(newBoard);
            setTurn('X');
            setMoves(m => m + 1);
          }
        }
      }, 700);
    }
  }, [board, turn, playMode, winner, phase]);

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
    if (playMode === 'player') {
      if (!isMyTurn) return;
      if (phase === 'placement') {
        if (board[row][col]) return;
        const newBoard = board.map(arr => [...arr]);
        newBoard[row][col] = turn;
        set(ref(db, `rooms/${roomName}/games/nineholes/board`), newBoard);
        set(ref(db, `rooms/${roomName}/games/nineholes/turn`), getNextTurn(turn));
        set(ref(db, `rooms/${roomName}/games/nineholes/moves`), moves + 1);
      } else {
        if (!selected) {
          if (board[row][col] === turn) setSelected({row, col});
          return;
        }
        // Move to adjacent empty cell
        if (board[row][col]) { setSelected(null); return; }
        const {row: sr, col: sc} = selected;
        if (Math.abs(sr-row) + Math.abs(sc-col) !== 1) { setSelected(null); return; }
        const newBoard = board.map(arr => [...arr]);
        newBoard[row][col] = turn;
        newBoard[sr][sc] = '';
        set(ref(db, `rooms/${roomName}/games/nineholes/board`), newBoard);
        set(ref(db, `rooms/${roomName}/games/nineholes/turn`), getNextTurn(turn));
        set(ref(db, `rooms/${roomName}/games/nineholes/moves`), moves + 1);
        setSelected(null);
      }
    } else {
      if (turn !== 'X') return;
      if (phase === 'placement') {
        const empty: [number, number][] = [];
        for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) if (!board[r][c]) empty.push([r, c]);
        if (empty.length) {
          const [row1, col1] = empty[Math.floor(Math.random() * empty.length)];
          const newBoard = board.map(arr => [...arr]);
          newBoard[row1][col1] = 'X';
          setBoard(newBoard);
          setTurn('O');
          setMoves(m => m + 1);
        }
      } else {
        // Move phase: pick random movable token and move to adjacent empty
        const movesList: Array<{from:[number,number],to:[number,number]}> = [];
        for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
          if (board[r][c] === 'X') {
            for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
              const nr = r+dr, nc = c+dc;
              if (nr>=0&&nr<3&&nc>=0&&nc<3 && !board[nr][nc]) movesList.push({from:[r,c],to:[nr,nc]});
            }
          }
        }
        if (movesList.length) {
          const move = movesList[Math.floor(Math.random()*movesList.length)];
          const newBoard = board.map(arr => [...arr]);
          newBoard[move.to[0]][move.to[1]] = 'X';
          newBoard[move.from[0]][move.from[1]] = '';
          setBoard(newBoard);
          setTurn('O');
          setMoves(m => m + 1);
        }
      }
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      {winner && <div className="text-xl font-bold text-yellow-400 mb-2">{winner} wins!</div>}
      <div className="grid grid-cols-3 w-44 border-4 border-yellow-400 rounded-lg shadow-xl bg-gradient-to-br from-slate-900 to-slate-700 mb-2">
        {board.map((rowArr, row) =>
          rowArr.map((cell, col) => (
            <div
              key={row + '-' + col}
              className={`aspect-square w-14 h-14 flex items-center justify-center text-2xl cursor-pointer border font-bold ${cell ? (cell==='X'?'text-blue-500':'text-red-500') : 'text-slate-400'} ${selected && selected.row===row && selected.col===col ? 'ring-2 ring-yellow-400' : ''}`}
              onClick={() => handleCellClick(row, col)}
            >
              {cell}
            </div>
          ))
        )}
      </div>
      {winner && (
        <button
          className="mt-2 bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
          onClick={() => {
            setBoard(initialBoard);
            setTurn('X');
            setMoves(0);
            setWinner(null);
            setSelected(null);
            if (playMode === 'player') {
              set(ref(db, `rooms/${roomName}/games/nineholes/board`), initialBoard);
              set(ref(db, `rooms/${roomName}/games/nineholes/turn`), 'X');
              set(ref(db, `rooms/${roomName}/games/nineholes/moves`), 0);
            }
          }}
        >Replay</button>
      )}
      <div className="text-xs text-slate-400">Phase: {phase === 'placement' ? 'Placement' : 'Move'} | Moves: {moves}</div>
    </div>
  );
}
