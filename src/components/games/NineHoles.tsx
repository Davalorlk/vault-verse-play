// Nine Holes game logic for two players (simplified demo)
import { useEffect, useState } from 'react';

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
    if (playMode === 'player' && !isMyTurn) return;
    if (phase === 'placement') {
      if (board[row][col]) return;
      const newBoard = board.map(arr => [...arr]);
      newBoard[row][col] = turn;
      if (playMode === 'player') {
        set(ref(db, `rooms/${roomName}/games/nineholes/board`), newBoard);
        set(ref(db, `rooms/${roomName}/games/nineholes/turn`), getNextTurn(turn));
        set(ref(db, `rooms/${roomName}/games/nineholes/moves`), moves + 1);
      } else {
        setBoard(newBoard);
        setTurn(getNextTurn(turn));
        setMoves(m => m + 1);
      }
      return;
    }
    // Move phase
    if (!selected) {
      if (board[row][col] === turn) setSelected({row, col});
      return;
    }
    // Only allow move to adjacent empty cell
    if (board[row][col]) { setSelected(null); return; }
    const {row: sr, col: sc} = selected;
    if (Math.abs(sr-row) + Math.abs(sc-col) !== 1) { setSelected(null); return; }
    const newBoard = board.map(arr => [...arr]);
    newBoard[row][col] = turn;
    newBoard[sr][sc] = '';
    if (playMode === 'player') {
      set(ref(db, `rooms/${roomName}/games/nineholes/board`), newBoard);
      set(ref(db, `rooms/${roomName}/games/nineholes/turn`), getNextTurn(turn));
      set(ref(db, `rooms/${roomName}/games/nineholes/moves`), moves + 1);
    } else {
      setBoard(newBoard);
      setTurn(getNextTurn(turn));
      setMoves(m => m + 1);
    }
    setSelected(null);
  }

  // Helper to get valid moves for a selected token
  function getValidMovesForSelected(row: number, col: number) {
    const moves: [number, number][] = [];
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nr = row + dr, nc = col + dc;
      if (nr >= 0 && nr < 3 && nc >= 0 && nc < 3 && !board[nr][nc]) {
        moves.push([nr, nc]);
      }
    }
    return moves;
  }

  return (
    <div className="flex flex-col md:flex-row items-center justify-center w-full h-full gap-8">
      <div className="flex flex-col items-center">
        {winner && <div className="text-xl font-bold text-yellow-400 mb-2">{winner} wins!</div>}
        {/* SVG Board */}
        <svg width="320" height="320" viewBox="0 0 300 300" className="mb-4">
          {/* Board lines */}
          <line x1="50" y1="50" x2="250" y2="50" stroke="#fff" strokeWidth="4" />
          <line x1="50" y1="150" x2="250" y2="150" stroke="#fff" strokeWidth="4" />
          <line x1="50" y1="250" x2="250" y2="250" stroke="#fff" strokeWidth="4" />
          <line x1="50" y1="50" x2="50" y2="250" stroke="#fff" strokeWidth="4" />
          <line x1="150" y1="50" x2="150" y2="250" stroke="#fff" strokeWidth="4" />
          <line x1="250" y1="50" x2="250" y2="250" stroke="#fff" strokeWidth="4" />
          {/* Diagonals */}
          <line x1="50" y1="50" x2="250" y2="250" stroke="#fff" strokeWidth="4" />
          <line x1="250" y1="50" x2="50" y2="250" stroke="#fff" strokeWidth="4" />
          {/* Nodes and tokens */}
          {Array.from({ length: 3 }).map((_, r) =>
            Array.from({ length: 3 }).map((_, c) => {
              const cx = 50 + c * 100;
              const cy = 50 + r * 100;
              const cell = board[r][c];
              const isSelected = selected && selected.row === r && selected.col === c;
              let isValidMove = false;
              if (selected && phase === 'move' && !cell) {
                const validMoves = getValidMovesForSelected(selected.row, selected.col);
                isValidMove = validMoves.some(([vr, vc]) => vr === r && vc === c);
              }
              return (
                <g key={`node-${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  style={{ cursor: winner ? 'default' : 'pointer' }}
                >
                  {/* Node background highlight */}
                  <circle cx={cx} cy={cy} r={28} fill={isSelected ? '#fde68a' : isValidMove ? '#bbf7d0' : 'rgba(255,255,255,0.08)'} stroke="#fff" strokeWidth={isSelected || isValidMove ? 4 : 2} />
                  {/* Token */}
                  {cell && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={20}
                      fill={cell === 'X' ? '#ffe066' : '#34d399'}
                      stroke="#222"
                      strokeWidth="3"
                      filter={isSelected ? 'drop-shadow(0 0 8px #fde68a)' : ''}
                    />
                  )}
                </g>
              );
            })
          )}
        </svg>
        <div className="text-xs text-slate-400 mb-2">Phase: {phase === 'placement' ? 'Placement' : 'Move'} | Moves: {moves}</div>
        <div className="text-xs text-slate-300">Click and select one of your pieces to move, then click a valid destination.</div>
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
      </div>
      {/* Player info */}
      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-full border-2 border-yellow-400 bg-yellow-200 inline-block" />
            <span className="text-lg font-bold text-yellow-200">You</span>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={`w-6 h-6 rounded-full border-2 ${tokens.X > i ? 'bg-yellow-200 border-yellow-400' : 'bg-slate-700 border-slate-500'}`} />
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-full border-2 border-green-400 bg-green-300 inline-block" />
            <span className="text-lg font-bold text-green-300">Computer</span>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={`w-6 h-6 rounded-full border-2 ${tokens.O > i ? 'bg-green-300 border-green-400' : 'bg-slate-700 border-slate-500'}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
