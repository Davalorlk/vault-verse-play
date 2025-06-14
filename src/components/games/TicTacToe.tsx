
import { useEffect, useState } from 'react';
import { socket } from '@/lib/socket';
import { TicTacToeGame } from '@/lib/games/TicTacToeGame';

export function TicTacToe({ roomName, user, isMyTurn, playMode }: { roomName: string, user: any, isMyTurn: boolean, playMode: 'player' | 'computer' }) {
  const [game, setGame] = useState<TicTacToeGame | null>(null);
  const [board, setBoard] = useState<string[][]>([]);
  const [turn, setTurn] = useState('X');
  const [winner, setWinner] = useState<string|null>(null);
  const [mySymbol, setMySymbol] = useState<string>('X');
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    const newGame = new TicTacToeGame();
    setGame(newGame);
    setBoard(newGame.board);
    setTurn(newGame.currentPlayer);
  }, []);

  useEffect(() => {
    if (playMode === 'player' && game) {
      socket.emit('join-game-room', { roomName, gameId: 'tictactoe' });
      
      // Listen for game initialization (assigns player symbols)
      socket.on('game-initialized', (data: { symbol: string, gameStarted: boolean }) => {
        setMySymbol(data.symbol);
        setGameStarted(data.gameStarted);
      });
      
      const handleGameState = (state: any) => {
        if (state.board) {
          game.loadState(state);
          setBoard([...game.board]);
          setTurn(state.currentPlayer);
          setWinner(state.winner);
        }
      };
      
      const handlePlayerJoined = (data: { playersCount: number }) => {
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
      }, 500);
    }
  }, [game, turn, playMode, winner]);

  function handleCellClick(row: number, col: number) {
    if (!game || winner) return;
    
    // For online mode, check if it's my turn and if I have the right symbol
    if (playMode === 'player') {
      if (!gameStarted) {
        console.log('Game not started yet, waiting for another player...');
        return;
      }
      if (turn !== mySymbol) {
        console.log(`Not your turn! Current turn: ${turn}, Your symbol: ${mySymbol}`);
        return;
      }
    }
    
    if (game.isValidMove(row, col)) {
      game.makeMove(row, col);
      setBoard([...game.board]);
      setTurn(game.currentPlayer);
      setWinner(game.winner);
      
      // Emit game state update for online mode
      if (playMode === 'player') {
        socket.emit('game-state-update', {
          roomName,
          gameId: 'tictactoe',
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
    <div className="flex flex-col items-center justify-center w-full h-full">
      {playMode === 'player' && (
        <div className="mb-4 text-center">
          {!gameStarted ? (
            <div className="text-yellow-500 font-bold">Waiting for another player to join...</div>
          ) : (
            <div className="space-y-2">
              <div className="text-white">You are: <span className="font-bold text-yellow-500">{mySymbol}</span></div>
              <div className={`font-bold ${isMyTurnToPlay ? 'text-green-500' : 'text-red-500'}`}>
                {isMyTurnToPlay ? 'Your turn!' : `Waiting for ${turn} to move...`}
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-3 w-44 border-4 border-yellow-400 rounded-lg shadow-xl bg-gradient-to-br from-slate-900 to-slate-700 mb-2">
        {board.map((rowArr, row) =>
          rowArr.map((cell, col) => (
            <div
              key={row + '-' + col}
              className={`aspect-square w-14 h-14 flex items-center justify-center text-3xl cursor-pointer border font-bold ${
                cell ? 'text-yellow-500' : 'text-slate-400'
              } ${
                isMyTurnToPlay && !cell && !winner ? 'hover:bg-slate-600' : ''
              }`}
              onClick={() => handleCellClick(row, col)}
            >
              {cell}
            </div>
          ))
        )}
      </div>
      
      {winner && (
        <div className="text-green-500 font-bold text-lg">
          {winner === 'Draw' ? 'It\'s a draw!' : 
           playMode === 'computer' ? `Winner: ${winner}` :
           winner === mySymbol ? 'You won!' : 'You lost!'}
        </div>
      )}
    </div>
  );
}
