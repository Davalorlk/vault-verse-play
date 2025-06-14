
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
  const [mySymbol, setMySymbol] = useState<string>('w');
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    const newGame = new CheckersGame();
    setGame(newGame);
    setBoard(newGame.board);
    setTurn(newGame.currentPlayer);
  }, []);

  useEffect(() => {
    if (playMode === 'player' && game) {
      socket.emit('join-game-room', { roomName, gameId: 'checkers' });
      
      socket.on('game-initialized', (data: { symbol: string, gameStarted: boolean }) => {
        console.log('Checkers game initialized:', data);
        setMySymbol(data.symbol);
        setGameStarted(data.gameStarted);
      });
      
      const handleGameState = (state: any) => {
        console.log('Checkers game state update received:', state);
        if (state.board) {
          game.loadState(state);
          setBoard([...game.board]);
          setTurn(game.currentPlayer);
          setWinner(game.winner);
        }
      };
      
      const handlePlayerJoined = (data: { playersCount: number }) => {
        console.log('Checkers player joined:', data);
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
    if (!game || winner) return;
    
    if (playMode === 'player') {
      if (!gameStarted) {
        console.log('Checkers game not started yet, waiting for another player...');
        return;
      }
      if (turn !== mySymbol) {
        console.log(`Not your turn! Current turn: ${turn}, Your symbol: ${mySymbol}`);
        return;
      }
    }

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
      console.log(`Making Checkers move: ${selected.row},${selected.col} to ${row},${col} as ${mySymbol}`);
      game.makeMove(selected, { row, col });
      setBoard([...game.board]);
      setTurn(game.currentPlayer);
      setWinner(game.winner);
      setSelected(null);
      setPossibleMoves([]);
      
      if (playMode === 'player') {
        console.log('Emitting Checkers game state update:', {
          board: game.board,
          currentPlayer: game.currentPlayer,
          winner: game.winner
        });
        socket.emit('game-state-update', {
          roomName,
          gameId: 'checkers',
          state: { 
            board: game.board, 
            currentPlayer: game.currentPlayer, 
            winner: game.winner 
          }
        });
      }
    } else {
      setSelected(null);
      setPossibleMoves([]);
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
                You are: <span className="font-bold text-yellow-500 text-lg">{mySymbol === 'w' ? 'White' : 'Black'}</span>
              </div>
              <div className={`font-bold text-sm sm:text-base ${isMyTurnToPlay ? 'text-green-500' : 'text-red-500'}`}>
                {isMyTurnToPlay ? 'Your turn!' : `Waiting for ${turn === 'w' ? 'White' : 'Black'} to move...`}
              </div>
              <div className="text-xs text-slate-400">
                Current turn: {turn === 'w' ? 'White' : 'Black'} | Game started: {gameStarted ? 'Yes' : 'No'}
              </div>
            </div>
          )}
        </div>
      )}
      
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
                    ${isPossibleMove ? 'ring-4 ring-green-400 z-10' : ''}
                    ${!isMyTurnToPlay ? 'opacity-70' : ''}`}
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
          <div className="text-green-500 font-bold text-lg mb-2">
            {playMode === 'computer' ? `Winner: ${winner === 'w' ? 'White' : 'Black'}` :
             winner === mySymbol ? 'You won! 🎉' : 'You lost! 😢'}
          </div>
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
              setMySymbol('w');
              setGameStarted(false);
            }}
          >Replay</button>
        </div>
      )}
    </div>
  );
}
