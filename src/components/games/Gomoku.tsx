import { useEffect, useState } from 'react';
import { socket } from '@/lib/socket';
import { GomokuGame } from '@/lib/games/GomokuGame';

export function Gomoku({ roomName, user, isMyTurn, playMode }: { roomName: string, user: any, isMyTurn: boolean, playMode: 'player' | 'computer' }) {
  const [game, setGame] = useState<GomokuGame | null>(null);
  const [board, setBoard] = useState<string[][]>([]);
  const [turn, setTurn] = useState('X');
  const [winner, setWinner] = useState<string|null>(null);

  useEffect(() => {
    const newGame = new GomokuGame(15); // 15x15 board
    setGame(newGame);
    setBoard(newGame.board);
    setTurn(newGame.currentPlayer);
  }, []);

  useEffect(() => {
    if (playMode === 'player' && game) {
      socket.emit('join-game-room', { roomName, gameId: 'gomoku' });
      
      const handleGameState = (state: any) => {
        if (state.board) {
          game.loadState(state);
          setBoard([...game.board]);
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
        gameId: 'gomoku',
        state: { board: game.board, currentPlayer: game.currentPlayer, winner: game.winner }
      });
    }
  }, [board, turn, playMode, roomName, game]);

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
    if (!game || winner || (playMode === 'player' && !isMyTurn)) return;
    
    if (game.isValidMove(row, col)) {
      game.makeMove(row, col);
      setBoard([...game.board]);
      setTurn(game.currentPlayer);
      setWinner(game.winner);
    }
  }

  if (!game) return <div>Loading game...</div>;

  const size = board.length;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
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
              className={`flex items-center justify-center text-sm cursor-pointer border border-slate-500 font-bold ${cell ? 'text-yellow-500' : 'text-slate-400 hover:bg-slate-800'}`}
              onClick={() => handleCellClick(row, col)}
              style={{ width: '20px', height: '20px' }}
            >
              {cell}
            </div>
          ))
        )}
      </div>
      {winner && <div className="text-green-500 font-bold text-lg">Winner: {winner}</div>}
    </div>
  );
}
