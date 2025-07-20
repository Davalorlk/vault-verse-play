import { BattleshipAI } from '@/lib/games/BattleshipAI';
import { BattleshipGame } from '@/lib/games/BattleshipGame';
import { socket } from '@/lib/socket';
import { useEffect, useState } from 'react';

export function Battleship({ roomName, user, isMyTurn, playMode }: { roomName: string, user: any, isMyTurn: boolean, playMode: 'player' | 'computer' }) {
  const [game, setGame] = useState<BattleshipGame | null>(null);
  const [myPlayer, setMyPlayer] = useState<string>('1');
  const [gameStarted, setGameStarted] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [selectedShip, setSelectedShip] = useState<number>(0);
  const [horizontal, setHorizontal] = useState(true);
  const [gameKey, setGameKey] = useState(0); // Force re-render key

  useEffect(() => {
    const newGame = new BattleshipGame();
    setGame(newGame);
    
    if (playMode === 'computer') {
      // Auto-place ships for computer
      newGame.randomPlaceShips('2');
      setGameStarted(true);
    }
  }, [playMode]);

  useEffect(() => {
    if (playMode === 'player' && game) {
      socket.emit('join-game-room', { roomName, gameId: 'battleship' });
      
      socket.on('game-initialized', (data: { symbol: string, gameStarted: boolean }) => {
        setMyPlayer(data.symbol);
        setGameStarted(data.gameStarted);
      });
      
      socket.on('game-state-update', (state: any) => {
        game.loadState(state);
        setGameKey(prev => prev + 1); // Force re-render
      });
      
      socket.on('player-joined', (data: { playersCount: number }) => {
        if (data.playersCount === 2) {
          setGameStarted(true);
        }
      });
      
      return () => {
        socket.off('game-state-update');
        socket.off('game-initialized');
        socket.off('player-joined');
      };
    }
  }, [roomName, playMode, game]);

  // Add AI turn handling
  useEffect(() => {
    if (game && playMode === 'computer' && game.phase === 'battle' && game.currentPlayer === '2') {
      setTimeout(() => {
        const enemyBoard = game.player1Board;
        const attackBoard = Array(10).fill(0).map(() => Array(10).fill(''));
        
        // Build attack board from game state
        for (let row = 0; row < 10; row++) {
          for (let col = 0; col < 10; col++) {
            if (enemyBoard[row][col] === 'H' || enemyBoard[row][col] === 'M') {
              attackBoard[row][col] = enemyBoard[row][col];
            }
          }
        }
        
        const aiMove = BattleshipAI.getBestMove(enemyBoard, attackBoard);
        if (aiMove) {
          const attackResult = game.attack('2', aiMove.row, aiMove.col);
          
          // Convert attack result to the format expected by AI
          let resultString: 'hit' | 'miss' | 'sunk';
          if (attackResult.sunk) {
            resultString = 'sunk';
          } else if (attackResult.hit) {
            resultString = 'hit';
          } else {
            resultString = 'miss';
          }
          
          BattleshipAI.onAttackResult(aiMove.row, aiMove.col, resultString);
          setGameKey(prev => prev + 1); // Force re-render
        }
      }, 1000);
    }
  }, [game?.currentPlayer, game?.phase, playMode]);

  useEffect(() => {
    if (playMode === 'computer' && game && game.winner) {
      const timer = setTimeout(() => {
        const newGame = new BattleshipGame();
        setGame(newGame);
        setSelectedShip(0);
        setSetupComplete(false);
        setGameKey(prev => prev + 1);
        newGame.randomPlaceShips('2');
        setGameStarted(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [game?.winner, playMode]);

  const handleCellClick = (row: number, col: number, isMyBoard: boolean) => {
    if (!game) return;

    if (game.phase === 'setup' && isMyBoard) {
      // Place ship
      if (game.placeShip(myPlayer, selectedShip, row, col, horizontal)) {
        setGameKey(prev => prev + 1); // Force re-render
        
        if (selectedShip < 4) {
          setSelectedShip(selectedShip + 1);
        } else if (game.allShipsPlaced(myPlayer)) {
          setSetupComplete(true);
          if (playMode === 'computer') {
            game.startBattle();
            setGameKey(prev => prev + 1); // Force re-render
          }
        }
      }
    } else if (game.phase === 'battle' && !isMyBoard) {
      // Attack
      if (game.currentPlayer === myPlayer || playMode === 'computer') {
        const result = game.attack(myPlayer, row, col);
        setGameKey(prev => prev + 1); // Force re-render
        
        if (playMode === 'player') {
          socket.emit('game-state-update', {
            roomName,
            gameId: 'battleship',
            state: game
          });
        }
      }
    }
  };

  const autoPlace = () => {
    if (!game) return;
    game.randomPlaceShips(myPlayer);
    setGameKey(prev => prev + 1); // Force re-render
    setSetupComplete(true);
    if (playMode === 'computer') {
      game.startBattle();
      setGameKey(prev => prev + 1); // Force re-render
    }
  };

  if (!game) return <div>Loading game...</div>;

  const myBoard = myPlayer === '1' ? game.player1Board : game.player2Board;
  const enemyBoard = myPlayer === '1' ? game.player2Board : game.player1Board;
  const myShips = myPlayer === '1' ? game.player1Ships : game.player2Ships;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-3 py-4" key={gameKey}>
      {/* Status Display */}
      <div className="mb-4 text-center w-full">
        {game.phase === 'setup' ? (
          <div className="space-y-2 p-3 bg-slate-800/50 rounded-lg">
            <div className="text-yellow-500 font-bold text-lg">Setup Phase</div>
            <div className="text-white text-sm">
              Place your ships on the board
            </div>
            {!setupComplete && (
              <div className="space-y-2">
                <div className="text-green-400">
                  Placing: {myShips[selectedShip]?.name} (Size: {myShips[selectedShip]?.size})
                </div>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => setHorizontal(!horizontal)}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                  >
                    {horizontal ? 'Horizontal' : 'Vertical'}
                  </button>
                  <button
                    onClick={autoPlace}
                    className="px-3 py-1 bg-green-500 text-white rounded text-sm"
                  >
                    Auto Place
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2 p-3 bg-slate-800/50 rounded-lg">
            <div className="text-green-500 font-bold text-lg">Battle Phase</div>
            <div className={`text-sm ${game.currentPlayer === myPlayer ? 'text-green-400' : 'text-red-400'}`}>
              {game.currentPlayer === myPlayer ? 'Your turn!' : 'Enemy turn'}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-8 flex-wrap justify-center">
        {/* My Board */}
        <div className="text-center">
          <h3 className="text-white font-bold mb-2">Your Fleet</h3>
          <div className="grid grid-cols-10 gap-1 bg-slate-800 p-2 rounded-lg">
            {myBoard.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div
                  key={`my-${rowIndex}-${colIndex}`}
                  className={`w-6 h-6 border border-slate-600 cursor-pointer flex items-center justify-center text-xs font-bold
                    ${cell === 'S' ? 'bg-blue-500' : 
                      cell === 'H' ? 'bg-red-500' : 
                      cell === 'M' ? 'bg-gray-500' : 'bg-blue-200'}
                    ${game.phase === 'setup' ? 'hover:bg-blue-300' : ''}`}
                  onClick={() => handleCellClick(rowIndex, colIndex, true)}
                >
                  {cell === 'H' ? '💥' : cell === 'M' ? '•' : ''}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Enemy Board */}
        {game.phase === 'battle' && (
          <div className="text-center">
            <h3 className="text-white font-bold mb-2">Enemy Waters</h3>
            <div className="grid grid-cols-10 gap-1 bg-slate-800 p-2 rounded-lg">
              {enemyBoard.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <div
                    key={`enemy-${rowIndex}-${colIndex}`}
                    className={`w-6 h-6 border border-slate-600 cursor-pointer flex items-center justify-center text-xs font-bold
                      ${cell === 'H' ? 'bg-red-500' : 
                        cell === 'M' ? 'bg-gray-500' : 'bg-blue-200'}
                      ${game.currentPlayer === myPlayer && cell !== 'H' && cell !== 'M' ? 'hover:bg-yellow-300' : ''}`}
                    onClick={() => handleCellClick(rowIndex, colIndex, false)}
                  >
                    {cell === 'H' ? '💥' : cell === 'M' ? '•' : ''}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Ships Status */}
      <div className="mt-4 grid grid-cols-5 gap-2 text-center">
        {myShips.map((ship, index) => (
          <div key={ship.name} className={`p-2 rounded ${ship.sunk ? 'bg-red-800' : 'bg-green-800'}`}>
            <div className="text-white text-xs font-bold">{ship.name}</div>
            <div className="text-xs text-slate-300">{ship.size} cells</div>
          </div>
        ))}
      </div>

      {game.winner && (
        <div className="mt-4 text-center">
          <div className="text-green-500 font-bold text-xl mb-2">
            {game.winner === myPlayer ? 'You won! 🎉' : 'You lost! 😢'}
          </div>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
            onClick={() => {
              const newGame = new BattleshipGame();
              setGame(newGame);
              setSelectedShip(0);
              setSetupComplete(false);
              setGameKey(prev => prev + 1); // Force re-render
              if (playMode === 'computer') {
                newGame.randomPlaceShips('2');
              }
            }}
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
