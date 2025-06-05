// Checkers game logic for two players
import { useEffect, useState } from 'react';

const initialBoard = [
  ['b','','b','','b','','b',''],
  ['','b','','b','','b','','b'],
  ['b','','b','','b','','b',''],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['','w','','w','','w','','w'],
  ['w','','w','','w','','w',''],
  ['','w','','w','','w','','w']
];

function getNextTurn(turn: string) {
  return turn === 'w' ? 'b' : 'w';
}

// Helper functions for move validation, capturing, kinging, and win detection
function isKing(piece: string) {
  return piece === 'W' || piece === 'B';
}
function isOpponent(piece: string, turn: string) {
  if (!piece) return false;
  return (turn === 'w' && (piece === 'b' || piece === 'B')) || (turn === 'b' && (piece === 'w' || piece === 'W'));
}
function getValidMoves(board: string[][], row: number, col: number, turn: string) {
  const piece = board[row][col];
  if (!piece || (turn === 'w' && piece.toLowerCase() !== 'w') || (turn === 'b' && piece.toLowerCase() !== 'b')) return [];
  const moves = [];
  const directions = [];
  if (piece === 'w' || piece === 'W') directions.push([-1, -1], [-1, 1]);
  if (piece === 'b' || piece === 'B') directions.push([1, -1], [1, 1]);
  if (isKing(piece)) directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
  // Normal moves
  for (const [dr, dc] of directions) {
    const nr = row + dr, nc = col + dc;
    if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc] === '') {
      moves.push({ to: [nr, nc], capture: null });
    }
    // Captures
    const cr = row + dr, cc = col + dc;
    const jr = row + 2 * dr, jc = col + 2 * dc;
    if (
      cr >= 0 && cr < 8 && cc >= 0 && cc < 8 &&
      isOpponent(board[cr][cc], turn) &&
      jr >= 0 && jr < 8 && jc >= 0 && jc < 8 &&
      board[jr][jc] === ''
    ) {
      moves.push({ to: [jr, jc], capture: [cr, cc] });
    }
  }
  return moves;
}
function hasAnyCapture(board: string[][], turn: string) {
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if ((turn === 'w' && (board[r][c] === 'w' || board[r][c] === 'W')) || (turn === 'b' && (board[r][c] === 'b' || board[r][c] === 'B'))) {
      if (getValidMoves(board, r, c, turn).some(m => m.capture)) return true;
    }
  }
  return false;
}
function getWinner(board: string[][]) {
  let w = 0, b = 0;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if (board[r][c] === 'w' || board[r][c] === 'W') w++;
    if (board[r][c] === 'b' || board[r][c] === 'B') b++;
  }
  if (w === 0) return 'Black';
  if (b === 0) return 'White';
  return null;
}

// Smarter Checkers AI: prefer captures, multi-captures, and block opponent
function getAllAIMoves(board: string[][], turn: string) {
  const moves = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if ((turn === 'w' && (board[r][c] === 'w' || board[r][c] === 'W')) || (turn === 'b' && (board[r][c] === 'b' || board[r][c] === 'B'))) {
      for (const move of getValidMoves(board, r, c, turn)) {
        moves.push({ from: [r, c], ...move });
      }
    }
  }
  return moves;
}
function evaluateBoard(board: string[][], turn: string) {
  let score = 0;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if (board[r][c] === 'w') score += 1;
    if (board[r][c] === 'W') score += 2;
    if (board[r][c] === 'b') score -= 1;
    if (board[r][c] === 'B') score -= 2;
  }
  return turn === 'w' ? score : -score;
}
function minimaxCheckers(board: string[][], turn: string, depth: number, maximizing: boolean) {
  const winner = getWinner(board);
  if (winner) return { score: winner === 'White' ? 100 : winner === 'Black' ? -100 : 0 };
  if (depth === 0) return { score: evaluateBoard(board, turn) };
  const moves = getAllAIMoves(board, turn);
  if (moves.length === 0) return { score: 0 };
  let bestScore = maximizing ? -Infinity : Infinity;
  let bestMove = null;
  for (const move of moves) {
    const newBoard = board.map(arr => [...arr]);
    const [fr, fc] = move.from;
    const [tr, tc] = move.to;
    newBoard[tr][tc] = newBoard[fr][fc];
    newBoard[fr][fc] = '';
    if (move.capture) {
      const [cr, cc] = move.capture;
      newBoard[cr][cc] = '';
    }
    // Kinging
    if (newBoard[tr][tc] === 'w' && tr === 0) newBoard[tr][tc] = 'W';
    if (newBoard[tr][tc] === 'b' && tr === 7) newBoard[tr][tc] = 'B';
    const result = minimaxCheckers(newBoard, getNextTurn(turn), depth - 1, !maximizing);
    if (maximizing && result.score > bestScore) {
      bestScore = result.score;
      bestMove = move;
    }
    if (!maximizing && result.score < bestScore) {
      bestScore = result.score;
      bestMove = move;
    }
  }
  return { score: bestScore, move: bestMove };
}

export function Checkers({ roomName, user, isMyTurn }: { roomName: string, user: any, isMyTurn: boolean }) {
  const [board, setBoard] = useState(initialBoard);
  const [turn, setTurn] = useState('w');
  const [selected, setSelected] = useState<{row: number, col: number} | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<{to: [number, number], capture: [number, number]|null}[]>([]);
  const [winner, setWinner] = useState<string|null>(null);

  useEffect(() => {
    setWinner(getWinner(board));
  }, [board]);

  useEffect(() => {
    // Add computer move for Checkers
    if (turn === 'b' && !winner) {
      setTimeout(() => {
        const { move } = minimaxCheckers(board, 'b', 3, true);
        if (move) {
          const newBoard = board.map(arr => [...arr]);
          const [fr, fc] = move.from;
          const [tr, tc] = move.to;
          newBoard[tr][tc] = newBoard[fr][fc];
          newBoard[fr][fc] = '';
          if (move.capture) {
            const [cr, cc] = move.capture;
            newBoard[cr][cc] = '';
          }
          if (newBoard[tr][tc] === 'b' && tr === 7) newBoard[tr][tc] = 'B';
          setBoard(newBoard);
          setTurn('w');
        }
      }, 700);
    }
  }, [board, turn, winner, roomName]);

  function handleCellClick(row: number, col: number) {
    if (winner) return;
    if (!isMyTurn) return;
    if (!selected) {
      if ((turn === 'w' && (board[row][col] === 'w' || board[row][col] === 'W')) || (turn === 'b' && (board[row][col] === 'b' || board[row][col] === 'B')) ) {
        const moves = getValidMoves(board, row, col, turn);
        // If any capture is available, only show captures
        if (hasAnyCapture(board, turn)) {
          setPossibleMoves(moves.filter(m => m.capture));
        } else {
          setPossibleMoves(moves);
        }
        setSelected({row, col});
      }
      return;
    }
    // Check if move is valid
    const move = possibleMoves.find(m => m.to[0] === row && m.to[1] === col);
    if (!move) {
      setSelected(null);
      setPossibleMoves([]);
      return;
    }
    const newBoard = board.map(arr => [...arr]);
    const piece = newBoard[selected.row][selected.col];
    newBoard[selected.row][selected.col] = '';
    newBoard[row][col] = piece;
    // Kinging
    if (piece === 'w' && row === 0) newBoard[row][col] = 'W';
    if (piece === 'b' && row === 7) newBoard[row][col] = 'B';
    // Capture
    if (move.capture) {
      const [cr, cc] = move.capture;
      newBoard[cr][cc] = '';
      // Check for multi-capture
      const moreCaptures = getValidMoves(newBoard, row, col, turn).filter(m => m.capture);
      if (moreCaptures.length) {
        setBoard(newBoard);
        setSelected({row, col});
        setPossibleMoves(moreCaptures);
        return;
      }
    }
    setBoard(newBoard);
    setTurn(getNextTurn(turn));
    setSelected(null);
    setPossibleMoves([]);
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      {winner && <div className="text-xl font-bold text-yellow-400 mb-2">{winner} wins!</div>}
      <div className="inline-block border-4 border-yellow-400 rounded-lg shadow-xl bg-gradient-to-br from-slate-900 to-slate-700 p-2">
        <div
          className="grid"
          style={{
            gridTemplateColumns: 'repeat(8, 48px)',
            gridTemplateRows: 'repeat(8, 48px)',
            gap: 0,
          }}
        >
          {board.map((rowArr, row) =>
            rowArr.map((cell, col) => {
              const isDark = (row + col) % 2 === 1;
              const isSelected = selected && selected.row === row && selected.col === col;
              const isMove = possibleMoves.some(m => m.to[0] === row && m.to[1] === col);
              return (
                <div
                  key={row + '-' + col}
                  className={`w-12 h-12 flex items-center justify-center select-none cursor-pointer transition-all duration-100
                    ${isDark ? 'bg-slate-700' : 'bg-slate-200'}
                    ${isSelected ? 'ring-4 ring-yellow-400 z-10' : ''}
                    ${isMove ? 'ring-4 ring-green-400 z-10' : ''}`}
                  onClick={() => handleCellClick(row, col)}
                >
                  {cell === 'w' && <span className="w-8 h-8 rounded-full bg-white border-2 border-slate-400 flex items-center justify-center" />}
                  {cell === 'b' && <span className="w-8 h-8 rounded-full bg-black border-2 border-slate-400 flex items-center justify-center" />}
                  {cell === 'W' && <span className="w-8 h-8 rounded-full bg-white border-2 border-yellow-400 flex items-center justify-center text-xl">♔</span>}
                  {cell === 'B' && <span className="w-8 h-8 rounded-full bg-black border-2 border-yellow-400 flex items-center justify-center text-xl text-white">♚</span>}
                </div>
              );
            })
          )}
        </div>
      </div>
      {winner && (
        <button
          className="mt-2 bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
          onClick={() => {
            setBoard(initialBoard);
            setTurn('w');
            setSelected(null);
            setPossibleMoves([]);
            setWinner(null);
          }}
        >Replay</button>
      )}
    </div>
  );
}
