// Checkers game logic for two players
import { socket } from '@/lib/socket';
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
// --- Smarter Checkers AI: minimax with capture preference ---
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
    if (newBoard[tr][tc] === 'b' && tr === 7) newBoard[tr][tc] = 'B';
    const result = minimaxCheckers(newBoard, turn === 'w' ? 'b' : 'w', depth - 1, !maximizing);
    if (maximizing ? result.score > bestScore : result.score < bestScore) {
      bestScore = result.score;
      bestMove = move;
    }
  }
  return { score: bestScore, move: bestMove };
}

export function Checkers({ roomName, user, isMyTurn, playMode }: { roomName: string, user: any, isMyTurn: boolean, playMode: 'player' | 'computer' }) {
  const [board, setBoard] = useState(initialBoard);
  const [turn, setTurn] = useState('w');
  const [selected, setSelected] = useState<{row: number, col: number} | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<{to: [number, number], capture: [number, number]|null}[]>([]);
  const [winner, setWinner] = useState<string|null>(null);

  useEffect(() => {
    if (playMode === 'player') {
      socket.emit('join-game-room', { roomName, gameId: 'checkers' });
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
      setTurn('w');
    }
  }, [roomName, playMode]);

  useEffect(() => {
    if (playMode === 'player') {
      socket.emit('game-state-update', {
        roomName,
        gameId: 'checkers',
        state: { board, turn }
      });
    }
  }, [board, turn, playMode, roomName]);

  useEffect(() => {
    setWinner(getWinner(board));
    if (playMode === 'computer' && turn === 'b' && !winner) {
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
  }, [board, turn, winner, playMode, roomName]);

  function handleCellClick(row: number, col: number) {
    if (winner) return;
    if (playMode === 'player' && !isMyTurn) return;
    if (!selected) {
      // Select a piece if it's the player's turn and piece belongs to them
      if ((turn === 'w' && (board[row][col] === 'w' || board[row][col] === 'W')) ||
          (turn === 'b' && (board[row][col] === 'b' || board[row][col] === 'B'))) {
        setSelected({ row, col });
        setPossibleMoves(getValidMoves(board, row, col, turn));
      }
      return;
    } else {
      // Try to move to the clicked cell if it's a valid move
      const moves = getValidMoves(board, selected.row, selected.col, turn);
      const move = moves.find(m => m.to[0] === row && m.to[1] === col);
      if (move) {
        const newBoard = board.map(arr => [...arr]);
        newBoard[row][col] = newBoard[selected.row][selected.col];
        newBoard[selected.row][selected.col] = '';
        if (move.capture) {
          const [cr, cc] = move.capture;
          newBoard[cr][cc] = '';
        }
        // King the piece if it reaches the last row
        if (turn === 'w' && row === 0 && newBoard[row][col] === 'w') newBoard[row][col] = 'W';
        if (turn === 'b' && row === 7 && newBoard[row][col] === 'b') newBoard[row][col] = 'B';
        setBoard(newBoard);
        setTurn(getNextTurn(turn));
        setSelected(null);
        setPossibleMoves([]);
      } else {
        setSelected(null);
        setPossibleMoves([]);
      }
    }
  }

  return (
    <div>
      <div className="board">
        {board.map((row, r) => (
          <div key={r} className="row">
            {row.map((cell, c) => {
              const isSelected = selected && selected.row === r && selected.col === c;
              const isPossibleMove = possibleMoves.some(m => m.to[0] === r && m.to[1] === c);
              return (
                <div
                  key={c}
                  className={`cell ${cell} ${isSelected ? 'selected' : ''} ${isPossibleMove ? 'possible-move' : ''}`}
                  onClick={() => handleCellClick(r, c)}
                />
              );
            })}
          </div>
        ))}
      </div>
      {winner && <div className="winner">{winner} wins!</div>}
    </div>
  );
}
