
import { useEffect, useState } from 'react';
import { socket } from '@/lib/socket';
import { ConnectFourGame } from '@/lib/games/ConnectFourGame';

export function ConnectFour({ roomName, user, isMyTurn, playMode }: { roomName: string, user: any, isMyTurn: boolean, playMode: 'player' | 'computer' }) {
  const [game, setGame] = useState<ConnectFourGame | null>(null);
  const [board, setBoard] = useState<string[][]>([]);
  const [turn, setTurn] = useState('R');
  const [winner, setWinner] = useState<string|null>(null);
  const [mySymbol, setMySymbol] = useState<string>('R');
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    const newGame = new ConnectFourGame();
    setGame(newGame);
    setBoard(newGame.board);
    setTurn(newGame.currentPlayer);
  }, []);

  useEffect(() => {
    if (playMode === 'player' && game) {
      socket.emit('join-game-room', { roomName, gameId: 'connect4' });
      
      socket.on('game-initialized', (data: { symbol: string, gameStarted: boolean }) => {
        console.log('Connect Four game initialized:', data);
        setMySymbol(data.symbol);
        setGameStarted(data.gameStarted);
      });
      
      const handleGameState = (state: any) => {
        console.log('Connect Four game state update received:', state);
        if (state.board) {
          game.loadState(state);
          setBoard([...game.board]);
          setTurn(game.currentPlayer);
          setWinner(game.winner);
        }
      };
      
      const handlePlayerJoined = (data: { playersCount: number }) => {
        console.log('Connect Four player joined:', data);
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
    if (game && playMode === 'computer' && turn === 'Y' && !winner) {
      setTimeout(() => {
        const availableMoves = game.getAvailableMoves();
        if (availableMoves.length > 0) {
          const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
          game.makeMove(randomMove);
          setBoard([...game.board]);
          setTurn(game.currentPlayer);
          setWinner(game.winner);
        }
      }, 600);
    }
  }, [game, turn, playMode, winner]);

  function handleColumnClick(col: number) {
    if (!game || winner) return;
    
    if (playMode === 'player') {
      if (!gameStarted) {
        console.log('Connect Four game not started yet, waiting for another player...');
        return;
      }
      if (turn !== mySymbol) {
        console.log(`Not your turn! Current turn: ${turn}, Your symbol: ${mySymbol}`);
        return;
      }
    }
    
    if (game.isValidMove(col)) {
      console.log(`Making Connect Four move: column ${col} as ${mySymbol}`);
      game.makeMove(col);
      setBoard([...game.board]);
      setTurn(game.currentPlayer);
      setWinner(game.winner);
      
      if (playMode === 'player') {
        console.log('Emitting Connect Four game state update:', {
          board: game.board,
          currentPlayer: game.currentPlayer,
          winner: game.winner
        });
        socket.emit('game-state-update', {
          roomName,
          gameId: 'connect4',
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

  const isMyTurnToPlay = playMode === 'computer' || (playMode === 'player' && turn === mySymbol && gameStarted);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-3">
      {/* Mobile-First Status Display */}
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
                Current turn: {turn} | Game started: {gameStarted ? 'Yes' : 'No'}
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="flex flex-col items-center">
        {winner && <div className="text-xl font-bold text-yellow-400 mb-2">
          {playMode === 'computer' ? `${winner} wins!` :
           winner === mySymbol ? 'You won! 🎉' : 'You lost! 😢'}
        </div>}
        
        <div className="grid grid-cols-7 w-72 border-4 border-yellow-400 rounded-lg shadow-xl bg-gradient-to-br from-slate-900 to-slate-700 mb-2">
          {Array.from({ length: 7 }).map((_, col) => (
            <button 
              key={col} 
              className={`h-6 ${isMyTurnToPlay && !winner ? 'bg-yellow-200 hover:bg-yellow-300' : 'bg-gray-300'}`} 
              onClick={() => handleColumnClick(col)} 
              disabled={!!winner || !isMyTurnToPlay}
            >
              ▼
            </button>
          ))}
          {board.map((rowArr, row) =>
            rowArr.map((cell, col) => (
              <div
                key={row + '-' + col}
                className={`aspect-square w-10 h-10 flex items-center justify-center text-2xl border font-bold ${cell === 'R' ? 'text-red-500' : cell === 'Y' ? 'text-yellow-500' : 'text-slate-400'}`}
              >
                {cell ? '●' : ''}
              </div>
            ))
          )}
        </div>
        
        {winner && (
          <button
            className="mt-2 bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
            onClick={() => {
              const newGame = new ConnectFourGame();
              setGame(newGame);
              setBoard(newGame.board);
              setTurn(newGame.currentPlayer);
              setWinner(null);
              setMySymbol('R');
              setGameStarted(false);
            }}
          >Replay</button>
        )}
      </div>
    </div>
  );
}
