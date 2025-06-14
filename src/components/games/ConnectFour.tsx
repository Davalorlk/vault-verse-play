
import { useEffect, useState } from 'react';
import { socket } from '@/lib/socket';
import { ConnectFour } from 'papergames.io';

export function ConnectFour({ roomName, user, isMyTurn, playMode }: { roomName: string, user: any, isMyTurn: boolean, playMode: 'player' | 'computer' }) {
  const [game, setGame] = useState<any>(null);
  const [board, setBoard] = useState<string[][]>([]);
  const [turn, setTurn] = useState('R');
  const [winner, setWinner] = useState<string|null>(null);

  useEffect(() => {
    const newGame = new ConnectFour();
    setGame(newGame);
    setBoard(newGame.board);
    setTurn(newGame.currentPlayer);
  }, []);

  useEffect(() => {
    if (playMode === 'player' && game) {
      socket.emit('join-game-room', { roomName, gameId: 'connect4' });
      
      const handleGameState = (state: any) => {
        if (state.board) {
          game.loadState(state);
          setBoard(game.board);
          setTurn(game.currentPlayer);
          setWinner(game.winner);
        }
      };
      
      socket.on('game-state-update', handleGameState);
      return () => {
        socket.off('game-state-update', handleGameState);
      };
    }
  }, [roomName, playMode, game]);

  useEffect(() => {
    if (playMode === 'player' && game) {
      socket.emit('game-state-update', {
        roomName,
        gameId: 'connect4',
        state: { board: game.board, currentPlayer: game.currentPlayer, winner: game.winner }
      });
    }
  }, [board, turn, playMode, roomName, game]);

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
    if (!game || winner || (playMode === 'player' && !isMyTurn)) return;
    
    if (game.isValidMove(col)) {
      game.makeMove(col);
      setBoard([...game.board]);
      setTurn(game.currentPlayer);
      setWinner(game.winner);
    }
  }

  if (!game) return <div>Loading game...</div>;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      {winner && <div className="text-xl font-bold text-yellow-400 mb-2">{winner} wins!</div>}
      <div className="grid grid-cols-7 w-72 border-4 border-yellow-400 rounded-lg shadow-xl bg-gradient-to-br from-slate-900 to-slate-700 mb-2">
        {Array.from({ length: 7 }).map((_, col) => (
          <button key={col} className="h-6 bg-yellow-200" onClick={() => handleColumnClick(col)} disabled={!!winner}>▼</button>
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
            const newGame = new ConnectFour();
            setGame(newGame);
            setBoard(newGame.board);
            setTurn(newGame.currentPlayer);
            setWinner(null);
          }}
        >Replay</button>
      )}
    </div>
  );
}
