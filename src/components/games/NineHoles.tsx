
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

function checkNineHolesWin(board: string[][]) {
  // Only horizontal and vertical wins
  for (let i = 0; i < 3; i++) {
    if (board[i][0] && board[i][0] === board[i][1] && board[i][1] === board[i][2]) return board[i][0];
    if (board[0][i] && board[0][i] === board[1][i] && board[1][i] === board[2][i]) return board[0][i];
  }
  return null;
}

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
  const [mySymbol, setMySymbol] = useState<string>('X');
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    if (playMode === 'player') {
      socket.emit('join-game-room', { roomName, gameId: 'nineholes' });
      
      socket.on('game-initialized', (data: { symbol: string, gameStarted: boolean }) => {
        console.log('Nine Holes game initialized:', data);
        setMySymbol(data.symbol);
        setGameStarted(data.gameStarted);
      });
      
      const handleGameState = (state: any) => {
        console.log('Nine Holes game state update received:', state);
        if (state.board) {
          setBoard(state.board);
          setTurn(state.turn);
          setMoves(state.moves || 0);
          setWinner(state.winner);
          setSelected(null);
        }
      };
      
      const handlePlayerJoined = (data: { playersCount: number }) => {
        console.log('Nine Holes player joined:', data);
        if (data.playersCount === 2) {
          setGameStarted(true);
        }
      };
      
      socket.on('game-state-update', handleGameState);
      socket.on('player-joined', handlePlayerJoined);
      
      return () => {
        socket.off('game-state-update', handleGameState);
        socket.off('game-initialized');
        socket.off('player-joined', handlePlayerJoined);
      };
    } else {
      setBoard(initialBoard);
      setTurn('X');
      setMoves(0);
      setGameStarted(true);
    }
  }, [roomName, playMode]);

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
      if (!gameStarted) {
        console.log('Nine Holes game not started yet, waiting for another player...');
        return;
      }
      if (turn !== mySymbol) {
        console.log(`Not your turn! Current turn: ${turn}, Your symbol: ${mySymbol}`);
        return;
      }
    }
    
    if (phase === 'placement') {
      if (board[row][col]) return;
      const newBoard = board.map(arr => [...arr]);
      newBoard[row][col] = turn;
      setBoard(newBoard);
      const newTurn = getNextTurn(turn);
      setTurn(newTurn);
      setMoves(m => m + 1);
      
      if (playMode === 'player') {
        console.log('Emitting Nine Holes game state update:', {
          board: newBoard,
          turn: newTurn,
          moves: moves + 1,
          winner: checkNineHolesWin(newBoard)
        });
        socket.emit('game-state-update', {
          roomName,
          gameId: 'nineholes',
          state: { 
            board: newBoard, 
            turn: newTurn, 
            moves: moves + 1,
            winner: checkNineHolesWin(newBoard)
          }
        });
      }
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
        const newTurn = getNextTurn(turn);
        setTurn(newTurn);
        setMoves(m => m + 1);
        setSelected(null);
        
        if (playMode === 'player') {
          console.log('Emitting Nine Holes game state update:', {
            board: newBoard,
            turn: newTurn,
            moves: moves + 1,
            winner: checkNineHolesWin(newBoard)
          });
          socket.emit('game-state-update', {
            roomName,
            gameId: 'nineholes',
            state: { 
              board: newBoard, 
              turn: newTurn, 
              moves: moves + 1,
              winner: checkNineHolesWin(newBoard)
            }
          });
        }
      } else {
        setSelected(null);
      }
    }
  }

  // Computer move effect
  useEffect(() => {
    if (playMode === 'computer' && !winner && turn === 'O' && gameStarted) {
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
  }, [turn, board, phase, playMode, winner, gameStarted]);

  const isMyTurnToPlay = playMode === 'computer' || (playMode === 'player' && turn === mySymbol && gameStarted);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-3">
      {/* Status Display */}
      {playMode === 'player' && (
        <div className="mb-4 text-center w-full">
          {!gameStarted ? (
            <div className="text-yellow-500 font-bold text-sm sm:text-base p-3 bg-slate-800/50 rounded-lg">
              Waiting for another player to join...
            </div>
          ) : (
            <div className="space-y-2 p-3 bg-slate-800/50 rounded-lg">
              <div className="text-white text-sm">
                You are: <span className="font-bold text-yellow-500 text-lg">{mySymbol}</span>
              </div>
              <div className={`font-bold text-sm sm:text-base ${isMyTurnToPlay ? 'text-green-500' : 'text-red-500'}`}>
                {isMyTurnToPlay ? 'Your turn!' : `Waiting for ${turn} to move...`}
              </div>
              <div className="text-xs text-slate-400">
                Current turn: {turn} | Phase: {phase} | Game started: {gameStarted ? 'Yes' : 'No'}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="grid grid-cols-3 gap-1 bg-slate-200 rounded-lg p-2 shadow-lg">
          {board.map((row, r) =>
            row.map((cell, c) => (
              <div
                key={`${r}-${c}`}
                className={`w-16 h-16 flex items-center justify-center text-3xl font-bold border-2 border-slate-400 rounded cursor-pointer select-none transition-all duration-150 ${
                  selected && selected.row === r && selected.col === c ? 'bg-yellow-200 text-black' : 
                  cell ? 'bg-white text-black' : 'bg-blue-100 text-slate-700 hover:bg-blue-200'
                } ${winner ? 'opacity-60 pointer-events-none' : ''} ${
                  isMyTurnToPlay && !cell && !winner ? 'hover:bg-blue-200' : ''
                }`}
                onClick={() => handleCellClick(r, c)}
              >
                {cell}
              </div>
            ))
          )}
        </div>
        
        <div className="flex gap-4 mt-4 text-white">
          <div className="text-lg">Turn: <span className="font-bold">{turn}</span></div>
          <div className="text-lg">Phase: <span className="font-bold capitalize">{phase}</span></div>
          <div className="text-lg">Tokens: X:{tokens.X} O:{tokens.O}</div>
        </div>
        
        {winner && (
          <div className="mt-4 text-2xl font-bold text-green-500">
            {playMode === 'computer' ? `Winner: ${winner}` :
             winner === mySymbol ? 'You won! 🎉' : 'You lost! 😢'}
          </div>
        )}
        
        <button 
          onClick={() => {
            setBoard(initialBoard);
            setTurn('X');
            setMoves(0);
            setSelected(null);
            setWinner(null);
            setGameStarted(playMode === 'computer');
            if (playMode === 'player') {
              socket.emit('reset-game', { roomName, gameId: 'nineholes' });
            }
          }} 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600 transition"
        >
          Restart Game
        </button>
      </div>
    </div>
  );
}
