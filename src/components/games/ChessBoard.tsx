// Chess game logic for two players, with real-time state sync via Firebase
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, set } from 'firebase/database';

const initialBoard = [
  ['r','n','b','q','k','b','n','r'],
  ['p','p','p','p','p','p','p','p'],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['P','P','P','P','P','P','P','P'],
  ['R','N','B','Q','K','B','N','R']
];

function getNextTurn(turn: string) {
  return turn === 'white' ? 'black' : 'white';
}

// Chess move generation and validation helpers
function isWhite(piece: string) { return piece && piece === piece.toUpperCase(); }
function isBlack(piece: string) { return piece && piece === piece.toLowerCase(); }
function getPieceMoves(board: string[][], row: number, col: number, turn: string) {
  const piece = board[row][col];
  if (!piece) return [];
  const moves = [];
  const isMyPiece = (turn === 'white' && isWhite(piece)) || (turn === 'black' && isBlack(piece));
  if (!isMyPiece) return [];
  const lower = piece.toLowerCase();
  // Pawn
  if (lower === 'p') {
    const dir = turn === 'white' ? -1 : 1;
    // Forward
    if (board[row+dir] && board[row+dir][col] === '') moves.push([row+dir, col]);
    // Double move
    if ((turn==='white' && row===6) || (turn==='black' && row===1)) {
      if (board[row+dir] && board[row+dir][col] === '' && board[row+2*dir][col] === '') moves.push([row+2*dir, col]);
    }
    // Captures
    for (const dc of [-1,1]) {
      if (board[row+dir] && board[row+dir][col+dc] && ((turn==='white' && isBlack(board[row+dir][col+dc])) || (turn==='black' && isWhite(board[row+dir][col+dc])))) {
        moves.push([row+dir, col+dc]);
      }
    }
  }
  // Knight
  else if (lower === 'n') {
    const knightMoves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    for (const [dr,dc] of knightMoves) {
      const nr=row+dr, nc=col+dc;
      if (nr>=0&&nr<8&&nc>=0&&nc<8 && (!board[nr][nc] || (turn==='white'?isBlack(board[nr][nc]):isWhite(board[nr][nc])))) moves.push([nr,nc]);
    }
  }
  // Bishop, Rook, Queen
  else if (lower === 'b' || lower === 'r' || lower === 'q') {
    const dirs = [];
    if (lower === 'b' || lower === 'q') dirs.push([-1,-1],[-1,1],[1,-1],[1,1]);
    if (lower === 'r' || lower === 'q') dirs.push([-1,0],[1,0],[0,-1],[0,1]);
    for (const [dr,dc] of dirs) {
      let nr=row+dr, nc=col+dc;
      while(nr>=0&&nr<8&&nc>=0&&nc<8) {
        if (!board[nr][nc]) moves.push([nr,nc]);
        else {
          if ((turn==='white'?isBlack(board[nr][nc]):isWhite(board[nr][nc]))) moves.push([nr,nc]);
          break;
        }
        nr+=dr; nc+=dc;
      }
    }
  }
  // King
  else if (lower === 'k') {
    const kingMoves = [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]];
    for (const [dr,dc] of kingMoves) {
      const nr=row+dr, nc=col+dc;
      if (nr>=0&&nr<8&&nc>=0&&nc<8 && (!board[nr][nc] || (turn==='white'?isBlack(board[nr][nc]):isWhite(board[nr][nc])))) moves.push([nr,nc]);
    }
  }
  return moves;
}
function isCheck(board: string[][], turn: string) {
  // Find king
  let kr=-1,kc=-1;
  for(let r=0;r<8;r++) for(let c=0;c<8;c++) {
    if ((turn==='white' && board[r][c]==='K') || (turn==='black' && board[r][c]==='k')) {kr=r;kc=c;}
  }
  // See if any opponent piece attacks king
  const opp = turn==='white'?'black':'white';
  for(let r=0;r<8;r++) for(let c=0;c<8;c++) {
    if ((opp==='white' && isWhite(board[r][c])) || (opp==='black' && isBlack(board[r][c]))) {
      const moves = getPieceMoves(board, r, c, opp);
      if (moves.some(([mr,mc])=>mr===kr&&mc===kc)) return true;
    }
  }
  return false;
}
function getAllValidMoves(board: string[][], turn: string) {
  const moves = [];
  for(let r=0;r<8;r++) for(let c=0;c<8;c++) {
    if ((turn==='white' && isWhite(board[r][c])) || (turn==='black' && isBlack(board[r][c]))) {
      for(const [mr,mc] of getPieceMoves(board, r, c, turn)) {
        // Make move, check for self-check
        const newBoard = board.map(arr=>[...arr]);
        newBoard[mr][mc]=newBoard[r][c]; newBoard[r][c]='';
        if (!isCheck(newBoard, turn)) moves.push({from:[r,c],to:[mr,mc]});
      }
    }
  }
  return moves;
}
function getWinner(board: string[][], turn: string) {
  if (getAllValidMoves(board, turn).length === 0) {
    if (isCheck(board, turn)) return turn==='white'?'Black':'White'; // Checkmate
    return 'Draw'; // Stalemate
  }
  return null;
}
function getBestAIMove(board: string[][], turn: string) {
  // 1. Try to capture
  const moves = getAllValidMoves(board, turn);
  for(const m of moves) {
    if (board[m.to[0]][m.to[1]]) return m;
  }
  // 2. Any move
  if (moves.length) return moves[Math.floor(Math.random()*moves.length)];
  return null;
}

// Smarter Chess AI: Minimax with material evaluation and shallow lookahead
function evaluateChessBoard(board: string[][]) {
  // Simple material count
  let score = 0;
  const values: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const piece = board[r][c];
    if (!piece) continue;
    const v = values[piece.toLowerCase()] || 0;
    score += piece === piece.toUpperCase() ? v : -v;
  }
  return score;
}
function minimaxChess(board: string[][], turn: string, depth: number, maximizing: boolean) {
  const winner = getWinner(board, turn);
  if (winner === 'White') return { score: 1000 };
  if (winner === 'Black') return { score: -1000 };
  if (winner === 'Draw') return { score: 0 };
  if (depth === 0) return { score: evaluateChessBoard(board) };
  const moves = getAllValidMoves(board, turn);
  if (moves.length === 0) return { score: 0 };
  let bestScore = maximizing ? -Infinity : Infinity;
  let bestMove = null;
  for (const move of moves) {
    const newBoard = board.map(arr => [...arr]);
    newBoard[move.to[0]][move.to[1]] = newBoard[move.from[0]][move.from[1]];
    newBoard[move.from[0]][move.from[1]] = '';
    const result = minimaxChess(newBoard, getNextTurn(turn), depth - 1, !maximizing);
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

export function ChessBoard({ roomName, user, isMyTurn, playMode }: { roomName: string, user: any, isMyTurn: boolean, playMode: 'player' | 'computer' }) {
  const [board, setBoard] = useState(initialBoard);
  const [turn, setTurn] = useState('white');
  const [selected, setSelected] = useState<{row: number, col: number} | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<{row:number,col:number}[]>([]);
  const [winner, setWinner] = useState<string|null>(null);

  useEffect(() => {
    if (playMode === 'player') {
      const boardRef = ref(db, `rooms/${roomName}/games/chess/board`);
      const turnRef = ref(db, `rooms/${roomName}/games/chess/turn`);
      onValue(boardRef, snap => {
        if (snap.exists()) setBoard(snap.val());
      });
      onValue(turnRef, snap => {
        if (snap.exists()) setTurn(snap.val());
      });
    } else {
      setBoard(initialBoard);
      setTurn('white');
    }
  }, [roomName, playMode]);

  useEffect(() => {
    setWinner(getWinner(board, turn));
    if (playMode === 'computer' && turn === 'black' && !winner) {
      setTimeout(() => {
        const { move } = minimaxChess(board, 'black', 2, true); // Depth 2 for performance
        if (move) {
          const newBoard = board.map(arr=>[...arr]);
          newBoard[move.to[0]][move.to[1]] = newBoard[move.from[0]][move.from[1]];
          newBoard[move.from[0]][move.from[1]] = '';
          setBoard(newBoard);
          setTurn('white');
        }
      }, 700);
    }
  }, [board, turn, playMode, winner]);

  function handleCellClick(row: number, col: number) {
    if (winner) return;
    if (playMode === 'player') {
      if (!isMyTurn) return;
      if (!selected) {
        if ((turn==='white' && isWhite(board[row][col])) || (turn==='black' && isBlack(board[row][col]))) {
          const moves = getPieceMoves(board, row, col, turn).filter(([mr,mc]) => {
            const newBoard = board.map(arr=>[...arr]);
            newBoard[mr][mc]=newBoard[row][col]; newBoard[row][col]='';
            return !isCheck(newBoard, turn);
          });
          setPossibleMoves(moves.map(([mr,mc])=>({row:mr,col:mc})));
          setSelected({row, col});
        }
        return;
      }
      const isMove = possibleMoves.some(m=>m.row===row&&m.col===col);
      if (!isMove) {
        setSelected(null); setPossibleMoves([]); return;
      }
      const newBoard = board.map(arr=>[...arr]);
      newBoard[row][col] = newBoard[selected.row][selected.col];
      newBoard[selected.row][selected.col] = '';
      set(ref(db, `rooms/${roomName}/games/chess/board`), newBoard);
      set(ref(db, `rooms/${roomName}/games/chess/turn`), getNextTurn(turn));
      setSelected(null); setPossibleMoves([]);
    } else {
      if (turn !== 'white') return;
      if (!selected) {
        if (isWhite(board[row][col])) {
          const moves = getPieceMoves(board, row, col, 'white').filter(([mr,mc]) => {
            const newBoard = board.map(arr=>[...arr]);
            newBoard[mr][mc]=newBoard[row][col]; newBoard[row][col]='';
            return !isCheck(newBoard, 'white');
          });
          setPossibleMoves(moves.map(([mr,mc])=>({row:mr,col:mc})));
          setSelected({row, col});
        }
        return;
      }
      const isMove = possibleMoves.some(m=>m.row===row&&m.col===col);
      if (!isMove) {
        setSelected(null); setPossibleMoves([]); return;
      }
      const newBoard = board.map(arr=>[...arr]);
      newBoard[row][col] = newBoard[selected.row][selected.col];
      newBoard[selected.row][selected.col] = '';
      setBoard(newBoard);
      setTurn('black');
      setSelected(null); setPossibleMoves([]);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      {winner && <div className="text-xl font-bold text-yellow-400 mb-2">{winner === 'Draw' ? 'Draw!' : `${winner} wins!`}</div>}
      <div className="grid grid-cols-8 w-80 border-4 border-yellow-400 rounded-lg shadow-xl bg-gradient-to-br from-slate-900 to-slate-700">
        {board.map((rowArr, row) =>
          rowArr.map((piece, col) => {
            const isMove = possibleMoves.some(m=>m.row===row&&m.col===col);
            return (
              <div
                key={row + '-' + col}
                className={`aspect-square w-10 h-10 flex items-center justify-center text-xl cursor-pointer font-bold ${((row+col)%2===0?'bg-slate-200':'bg-slate-600')} ${selected && selected.row===row && selected.col===col ? 'ring-2 ring-yellow-400' : ''} ${isMove ? 'ring-2 ring-green-400' : ''}`}
                onClick={() => handleCellClick(row, col)}
              >
                {piece}
              </div>
            );
          })
        )}
      </div>
      {winner && (
        <button
          className="mt-2 bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
          onClick={() => {
            setBoard(initialBoard);
            setTurn('white');
            setSelected(null);
            setPossibleMoves([]);
            setWinner(null);
            if (playMode === 'player') {
              set(ref(db, `rooms/${roomName}/games/chess/board`), initialBoard);
              set(ref(db, `rooms/${roomName}/games/chess/turn`), 'white');
            }
          }}
        >Replay</button>
      )}
    </div>
  );
}
