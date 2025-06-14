
import { useEffect, useState } from 'react';
import { socket } from '@/lib/socket';
import { GomokuGame } from '@/lib/games/GomokuGame';

export function Gomoku({ roomName, user, isMyTurn, playMode }: { roomName: string, user: any, isMyTurn: boolean, playMode: 'player' | 'computer' }) {
  const [game, setGame] = useState<GomokuGame | null>(null);
  const [board, setBoard] = useState<string[][]>([]);
  const [turn, setTurn] = useState('X');
  const [winner, setWinner] = useState<string|null>(null);
  const [mySymbol, setMySymbol] = useState<string>('X');
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    const newGame = new GomokuGame(15); // 15x15 board
    setGame(newGame);
    setBoard(newGame.board);
    setTurn(newGame.currentPlayer);
  }, []);

  useEffect(() => {
    if (playMode === 'player' && game) {
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
        const availableMoves = game.getAvailableMoves();
        if (availableMoves.length > 0) {
          const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
          game.makeMove(randomMove.row, randomMove.col);
          setBoard([...game.board]);
          setTurn(game.currentPlayer);
          setWinner(game.winner);
        }
      }, 600);
    }
  }, [game, turn, playMode, winner]);

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
      
      <div 
        className="border-4 border-yellow-400 rounded-lg shadow-xl bg-gradient-to-br from-slate-900 to-slate-700 mb-2"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          width: `${size * 20}px`,
          height: `${size * 20}px`
        }}
      >
        {board.map((rowArr, row) =>
          rowArr.map((cell, col) => (
            <div
              key={row + '-' + col}
              className={`flex items-center justify-center text-sm cursor-pointer border border-slate-500 font-bold ${
                cell ? 'text-yellow-500' : 'text-slate-400'
              } ${
                isMyTurnToPlay && !cell && !winner ? 'hover:bg-slate-800' : ''
              }`}
              onClick={() => handleCellClick(row, col)}
              style={{ width: '20px', height: '20px' }}
            >
              {cell}
            </div>
          ))
        )}
      </div>
      {winner && (
        <div className="text-green-500 font-bold text-lg text-center">
          {playMode === 'computer' ? `Winner: ${winner}` :
           winner === mySymbol ? 'You won! 🎉' : 'You lost! 😢'}
        </div>
      )}
    </div>
  );
}
