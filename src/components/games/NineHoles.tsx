import { socket } from '@/lib/socket';
import { useEffect, useState } from 'react';

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
  // AI logic remains the same
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
    
    if (!selected) {
      if (board[row][col] === turn) {
        setSelected({ row, col });
      }
      return;
    } else {
      const { row: fromRow, col: fromCol } = selected;
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

  useEffect(() => {
    if (playMode === 'computer' && winner) {
      const timer = setTimeout(() => {
        setBoard(initialBoard);
        setTurn('X');
        setMoves(0);
        setPhase('placement');
        setTokens({ X: 0, O: 0 });
        setSelected(null);
        setWinner(null);
        setMySymbol('X');
        setGameStarted(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [winner, playMode]);

  const isMyTurnForReal = playMode === 'player' ? turn === mySymbol : turn === 'X';

  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-3 py-4">
      {/* Status Display */}
      <div className="mb-4 text-center w-full max-w-md">
        {!gameStarted && playMode === 'player' ? (
          <div className="text-yellow-500 font-bold text-sm p-3 bg-slate-800/50 rounded-lg">
            Waiting for another player to join...
          </div>
        ) : !winner ? (
          <div className="space-y-2 p-3 bg-slate-800/50 rounded-lg">
            <div className="text-white text-sm">
              You are: <span className={`font-bold text-lg ${mySymbol === 'X' ? 'text-blue-400' : 'text-red-400'}`}>{mySymbol}</span>
            </div>
            <div className={`font-bold text-lg ${isMyTurnForReal ? 'text-green-500' : 'text-red-500'}`}>
              {isMyTurnForReal ? 'Your turn!' : "Opponent's turn"}
            </div>
            <div className="text-xs text-slate-400 capitalize">
              Phase: {phase}
            </div>
          </div>
        ) : null}
      </div>

      {/* Board */}
      <div className="bg-slate-800 p-2 rounded-lg shadow-lg">
        <div className="relative">
          {/* Grid Lines */}
          <svg width="240" height="240" className="absolute inset-0 pointer-events-none">
            {/* Outer square */}
            <rect x="20" y="20" width="200" height="200" fill="none" stroke="#fbbf24" strokeWidth="3"/>
            
            {/* Cross lines */}
            <line x1="20" y1="120" x2="220" y2="120" stroke="#fbbf24" strokeWidth="2"/>
            <line x1="120" y1="20" x2="120" y2="220" stroke="#fbbf24" strokeWidth="2"/>
            
            {/* Diagonal lines */}
            <line x1="20" y1="20" x2="220" y2="220" stroke="#fbbf24" strokeWidth="2"/>
            <line x1="220" y1="20" x2="20" y2="220" stroke="#fbbf24" strokeWidth="2"/>
          </svg>
          
          {/* Game Positions */}
          <div className="relative w-60 h-60">
            {/* Nine holes positions */}
            {[
              [20, 20], [120, 20], [220, 20],
              [20, 120], [120, 120], [220, 120],
              [20, 220], [120, 220], [220, 220]
            ].map(([x, y], index) => {
              const row = Math.floor(index / 3);
              const col = index % 3;
              const piece = board[row][col];
              const isSelected = selected?.row === row && selected?.col === col;
              
              return (
                <div
                  key={index}
                  className={`absolute w-12 h-12 rounded-full border-4 cursor-pointer transform -translate-x-6 -translate-y-6 transition-all duration-200 ${
                    piece 
                      ? piece === 'X' 
                        ? 'bg-blue-500 border-blue-300 shadow-lg' 
                        : 'bg-red-500 border-red-300 shadow-lg'
                      : 'bg-gray-700/50 border-gray-500 hover:bg-gray-600/70'
                  } ${
                    isSelected ? 'ring-4 ring-yellow-400 scale-110' : ''
                  } ${
                    !winner && isMyTurnForReal ? 'hover:scale-105' : ''
                  }`}
                  style={{ left: x, top: y }}
                  onClick={() => handleCellClick(row, col)}
                >
                  {piece && (
                    <div className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {piece}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Result Display */}
      {winner && (
        <div className="mt-4 text-center">
          <div className="text-2xl font-bold mb-2">
            {winner === 'draw' ? (
              <span className="text-yellow-500">It's a draw!</span>
            ) : winner === mySymbol ? (
              <span className="text-green-500">You won! 🎉</span>
            ) : (
              <span className="text-red-500">You lost! 😢</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
