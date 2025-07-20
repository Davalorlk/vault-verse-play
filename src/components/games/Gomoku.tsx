import { useIsMobile } from '@/hooks/use-mobile';
import { GomokuAI } from '@/lib/games/GomokuAI';
import { GomokuGame } from '@/lib/games/GomokuGame';
import { socket } from '@/lib/socket';
import { useEffect, useState } from 'react';

export function Gomoku({ roomName, user, isMyTurn, playMode }: { roomName: string, user: any, isMyTurn: boolean, playMode: 'player' | 'computer' }) {
  const [game, setGame] = useState<GomokuGame | null>(null);
  const [board, setBoard] = useState<string[][]>([]);
  const [turn, setTurn] = useState('X');
  const [winner, setWinner] = useState<string|null>(null);
  const [mySymbol, setMySymbol] = useState<string>('X');
  const [gameStarted, setGameStarted] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const newGame = new GomokuGame(15); // 15x15 board
    setGame(newGame);
    setBoard(newGame.board);
    setTurn(newGame.currentPlayer);
  }, []);

  useEffect(() => {
    if (playMode === 'player' && game) {
      console.log('Gomoku: Joining game room:', roomName);
      socket.emit('join-game-room', { roomName, gameId: 'gomoku' });
      
      socket.on('game-initialized', (data: { symbol: string, gameStarted: boolean }) => {
        console.log('Gomoku game initialized:', data);
        setMySymbol(data.symbol);
        setGameStarted(data.gameStarted);
      });
      
      const handleGameState = (state: any) => {
        console.log('Gomoku game state update received:', state);
        if (state.board) {
          game.loadState(state);
          setBoard([...game.board]);
          setTurn(state.currentPlayer);
          setWinner(state.winner);
        }
      };
      
      const handlePlayerJoined = (data: { playersCount: number }) => {
        console.log('Gomoku player joined:', data);
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
    }
  }, [roomName, playMode, game]);

  useEffect(() => {
    if (game && playMode === 'computer' && turn === 'O' && !winner) {
      setTimeout(() => {
        const bestMove = GomokuAI.getBestMove(game.board, 'O');
        if (bestMove) {
          game.makeMove(bestMove.row, bestMove.col);
          setBoard([...game.board]);
          setTurn(game.currentPlayer);
          setWinner(game.winner);
        }
      }, 600);
    }
  }, [game, turn, playMode, winner]);

  useEffect(() => {
    if (playMode === 'computer' && winner) {
      const timer = setTimeout(() => {
        const newGame = new GomokuGame();
        setGame(newGame);
        setBoard(newGame.board);
        setTurn(newGame.currentPlayer);
        setWinner(null);
        setMySymbol('X');
        setGameStarted(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [winner, playMode]);

  function handleCellClick(row: number, col: number) {
    if (!game || winner) return;
    
    if (playMode === 'player') {
      if (!gameStarted) {
        console.log('Gomoku game not started yet, waiting for another player...');
        return;
      }
      if (turn !== mySymbol) {
        console.log(`Not your turn! Current turn: ${turn}, Your symbol: ${mySymbol}`);
        return;
      }
    }
    
    if (game.isValidMove(row, col)) {
      console.log(`Making Gomoku move: ${row}, ${col} as ${mySymbol}`);
      game.makeMove(row, col);
      setBoard([...game.board]);
      setTurn(game.currentPlayer);
      setWinner(game.winner);
      
      if (playMode === 'player') {
        console.log('Emitting Gomoku game state update:', {
          board: game.board,
          currentPlayer: game.currentPlayer,
          winner: game.winner
        });
        socket.emit('game-state-update', {
          roomName,
          gameId: 'gomoku',
          state: { 
            board: game.board, 
            currentPlayer: game.currentPlayer, 
            winner: game.winner 
          }
        });
      }
    }
  }

  if (!game) return <div>Loading game...</div>;

  const size = board.length;
  const isMyTurnForReal = playMode === 'player' ? turn === mySymbol : turn === 'X';
  
  // Calculate responsive cell size based on screen size
  const cellSize = isMobile ? Math.max(24, Math.floor((window.innerWidth - 40) / size)) : 32;
  const boardSize = cellSize * (size - 1) + 32; // Add padding for border

  // Helper: render board lines as SVG
  function renderBoardLines() {
    const lines = [];
    for (let i = 0; i < size; i++) {
      // Horizontal
      lines.push(<line key={`h-${i}`} x1={16} y1={16 + i * cellSize} x2={16 + (size - 1) * cellSize} y2={16 + i * cellSize} stroke="#222" strokeWidth={2} />);
      // Vertical
      lines.push(<line key={`v-${i}`} x1={16 + i * cellSize} y1={16} x2={16 + i * cellSize} y2={16 + (size - 1) * cellSize} stroke="#222" strokeWidth={2} />);
    }
    return lines;
  }

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
              You are: <span className={`font-bold text-lg ${mySymbol === 'X' ? 'text-white' : 'text-gray-400'}`}>{mySymbol}</span>
            </div>
            <div className={`font-bold text-lg ${isMyTurnForReal ? 'text-green-500' : 'text-red-500'}`}>
              {isMyTurnForReal ? 'Your turn!' : "Opponent's turn"}
            </div>
          </div>
        ) : null}
      </div>

      {/* Board */}
      <div
        className="relative bg-amber-700 rounded-lg shadow-lg"
        style={{ width: boardSize, height: boardSize }}
      >
        {/* Board lines as SVG */}
        <svg
          width={boardSize}
          height={boardSize}
          style={{ position: 'absolute', left: 0, top: 0, zIndex: 1 }}
        >
          {renderBoardLines()}
        </svg>
        {/* Intersections as clickable cells */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: boardSize,
            height: boardSize,
            zIndex: 2,
          }}
        >
          {board.map((row, r) =>
            row.map((cell, c) => {
              const x = 16 + c * cellSize;
              const y = 16 + r * cellSize;
              return (
                <div
                  key={`${r}-${c}`}
                  style={{
                    position: 'absolute',
                    left: x - 14,
                    top: y - 14,
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: cell || winner ? 'default' : 'pointer',
                    borderRadius: '50%',
                    background: cell
                      ? 'none'
                      : !winner && isMyTurnForReal
                        ? 'rgba(255,255,255,0.04)'
                        : 'none',
                    transition: 'background 0.15s',
                  }}
                  onClick={() => !cell && !winner && isMyTurnForReal && handleCellClick(r, c)}
                  tabIndex={0}
                  role="button"
                  aria-label={`Cell ${r + 1}, ${c + 1}`}
                  onMouseOver={e => {
                    if (!cell && !winner && isMyTurnForReal) e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                  }}
                  onMouseOut={e => {
                    if (!cell && !winner && isMyTurnForReal) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  }}
                >
                  {cell && (
                    <div
                      className={`rounded-full shadow-lg ${cell === 'X' ? 'bg-black' : 'bg-white'}`}
                      style={{ width: 20, height: 20, border: '2px solid #222' }}
                    />
                  )}
                </div>
              );
            })
          )}
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
