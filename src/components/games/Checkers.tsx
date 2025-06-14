import { useEffect, useState } from 'react';
import { socket } from '@/lib/socket';
import { CheckersGame } from '@/lib/games/CheckersGame';

export function Checkers({ roomName, user, isMyTurn, playMode }: { roomName: string, user: any, isMyTurn: boolean, playMode: 'player' | 'computer' }) {
  const [game, setGame] = useState<CheckersGame | null>(null);
  const [board, setBoard] = useState<string[][]>([]);
  const [turn, setTurn] = useState('w');
  const [selected, setSelected] = useState<{row: number, col: number} | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<any[]>([]);
  const [winner, setWinner] = useState<string|null>(null);

  useEffect(() => {
    const newGame = new CheckersGame();
    setGame(newGame);
    setBoard(newGame.board);
    setTurn(newGame.currentPlayer);
  }, []);

  useEffect(() => {
    if (playMode === 'player' && game) {
      socket.emit('join-game-room', { roomName, gameId: 'checkers' });
      
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
        gameId: 'checkers',
        state: { board: game.board, currentPlayer: game.currentPlayer, winner: game.winner }
      });
    }
  }, [board, turn, playMode, roomName, game]);

  useEffect(() => {
    if (game && playMode === 'computer' && turn === 'b' && !winner) {
      setTimeout(() => {
        const availableMoves = game.getAvailableMoves();
        if (availableMoves.length > 0) {
          const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
          game.makeMove(randomMove.from, randomMove.to);
          setBoard([...game.board]);
          setTurn(game.currentPlayer);
          setWinner(game.winner);
        }
      }, 700);
    }
  }, [game, turn, playMode, winner]);

  function handleCellClick(row: number, col: number) {
    if (!game || winner || (playMode === 'player' && !isMyTurn)) return;

    if (!selected) {
      const piece = board[row][col];
      if (piece && ((turn === 'w' && (piece === 'w' || piece === 'W')) || (turn === 'b' && (piece === 'b' || piece === 'B')))) {
        const moves = game.getValidMoves(row, col);
        setPossibleMoves(moves);
        setSelected({ row, col });
      }
      return;
    }

    const move = possibleMoves.find(m => m.to.row === row && m.to.col === col);
    if (move) {
      game.makeMove(selected, { row, col });
      setBoard([...game.board]);
      setTurn(game.currentPlayer);
      setWinner(game.winner);
      setSelected(null);
      setPossibleMoves([]);
    } else {
      setSelected(null);
      setPossibleMoves([]);
    }
  }

  if (!game) return <div>Loading game...</div>;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div className="inline-block border-4 border-yellow-400 rounded-lg shadow-xl bg-gradient-to-br from-amber-900 to-amber-700 p-2">
        <div
          className="grid"
          style={{
            gridTemplateColumns: 'repeat(8, 48px)',
            gridTemplateRows: 'repeat(8, 48px)',
            gap: 1,
          }}
        >
          {board.map((rowArr, row) =>
            rowArr.map((cell, col) => {
              const isDark = (row + col) % 2 === 1;
              const isSelected = selected && selected.row === row && selected.col === col;
              const isPossibleMove = possibleMoves.some(m => m.to.row === row && m.to.col === col);
              
              return (
                <div
                  key={row + '-' + col}
                  className={`w-12 h-12 flex items-center justify-center text-2xl font-bold select-none cursor-pointer transition-all duration-100
                    ${isDark ? 'bg-amber-800' : 'bg-amber-200'}
                    ${isSelected ? 'ring-4 ring-yellow-400 z-10' : ''}
                    ${isPossibleMove ? 'ring-4 ring-green-400 z-10' : ''}`}
                  onClick={() => handleCellClick(row, col)}
                >
                  {cell === 'w' && <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-400"></div>}
                  {cell === 'W' && <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-400 relative"><div className="absolute inset-2 rounded-full bg-yellow-400"></div></div>}
                  {cell === 'b' && <div className="w-8 h-8 rounded-full bg-black border-2 border-gray-400"></div>}
                  {cell === 'B' && <div className="w-8 h-8 rounded-full bg-black border-2 border-gray-400 relative"><div className="absolute inset-2 rounded-full bg-red-400"></div></div>}
                </div>
              );
            })
          )}
        </div>
      </div>
      {winner && (
        <div className="mt-4 text-center">
          <div className="text-green-500 font-bold text-lg mb-2">Winner: {winner === 'w' ? 'White' : 'Black'}</div>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
            onClick={() => {
              const newGame = new CheckersGame();
              setGame(newGame);
              setBoard(newGame.board);
              setTurn(newGame.currentPlayer);
              setSelected(null);
              setPossibleMoves([]);
              setWinner(null);
            }}
          >Replay</button>
        </div>
      )}
    </div>
  );
}
