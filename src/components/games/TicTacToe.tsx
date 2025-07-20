import { useIsMobile } from '@/hooks/use-mobile';
import { TicTacToeAI } from '@/lib/games/TicTacToeAI';
import { TicTacToeGame } from '@/lib/games/TicTacToeGame';
import { socket } from '@/lib/socket';
import { useEffect, useState } from 'react';

export function TicTacToe({ roomName, user, isMyTurn, playMode, onGameEnd, roomPlayers, gameKey }: { roomName: string, user: any, isMyTurn: boolean, playMode: 'player' | 'computer', onGameEnd?: () => void, roomPlayers?: any[], gameKey: number }) {
  const [game, setGame] = useState<TicTacToeGame | null>(null);
  const [board, setBoard] = useState<string[][]>([]);
  const [turn, setTurn] = useState('X');
  const [winner, setWinner] = useState<string|null>(null);
  const [mySymbol, setMySymbol] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const newGame = new TicTacToeGame();
    setGame(newGame);
    setBoard(newGame.board);
    setTurn(newGame.currentPlayer);
  }, []);

  useEffect(() => {
    if (playMode === 'player' && game) {
      socket.emit('join-game-room', { roomName, gameId: 'tictactoe' });

      const handleGameInitialized = (data: { symbol: string, gameStarted: boolean, currentPlayer?: string }) => {
        console.log('[TicTacToe] Received game-initialized:', data);
        setMySymbol(data.symbol);
        setGameStarted(data.gameStarted);
        if (data.currentPlayer) setTurn(data.currentPlayer);
      };
      socket.on('game-initialized', handleGameInitialized);

      const handleGameState = (state: any) => {
        if (state.board) {
          game.loadState(state);
          setBoard([...game.board]);
          setTurn(game.currentPlayer);
          setWinner(game.winner);
        }
      };
      socket.on('game-state-update', handleGameState);

      const handlePlayerJoined = (data: { playersCount: number }) => {
        if (data.playersCount === 2) {
          setGameStarted(true);
        }
      };
      socket.on('player-joined', handlePlayerJoined);

      return () => {
        socket.off('game-initialized', handleGameInitialized);
        socket.off('game-state-update', handleGameState);
        socket.off('player-joined', handlePlayerJoined);
      };
    } else if (game) {
      setMySymbol('X'); // Human is always X in computer mode
      setGameStarted(true);
    }
  }, [roomName, playMode, game, gameKey]);

  useEffect(() => {
    if (game && playMode === 'computer' && turn === 'O' && !winner) {
      setTimeout(() => {
        const bestMove = TicTacToeAI.getBestMove(game.board, 'O');
        if (bestMove) {
          game.makeMove(bestMove.row, bestMove.col);
          setBoard([...game.board]);
          setTurn(game.currentPlayer);
          setWinner(game.winner);
        }
      }, 500);
    }
  }, [game, turn, playMode, winner]);

  useEffect(() => {
    if (game && game.winner && onGameEnd) {
      onGameEnd();
    }
  }, [game?.winner, onGameEnd]);

  useEffect(() => {
    if (playMode === 'computer' && winner) {
      const timer = setTimeout(() => {
        const newGame = new TicTacToeGame();
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
        console.log('Game not started yet, waiting for another player...');
        return;
      }
      // Fix: Check if it's actually my turn based on current game state
      if (turn !== mySymbol) {
        console.log(`Not your turn! Current turn: ${turn}, Your symbol: ${mySymbol}`);
        return;
      }
    }
    
    if (game.isValidMove(row, col)) {
      console.log(`Making move: ${row}, ${col} as ${mySymbol}`);
      game.makeMove(row, col);
      setBoard([...game.board]);
      setTurn(game.currentPlayer);
      setWinner(game.winner);
      
      if (playMode === 'player') {
        console.log('Emitting game state update:', {
          board: game.board,
          currentPlayer: game.currentPlayer,
          winner: game.winner
        });
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

  // Use roomPlayers.length as the source of truth for playersCount
  const playersCount = roomPlayers ? roomPlayers.length : 0;

  useEffect(() => {
    if (playMode === 'player') {
      setGameStarted(playersCount === 2);
    } else {
      setGameStarted(true);
    }
  }, [playMode, playersCount]);

  // Add debug logging for playersCount and gameStarted
  console.log('[TicTacToe Render] playersCount:', playersCount, 'gameStarted:', gameStarted);
  // Add debug logging for mySymbol before rendering
  console.log('[TicTacToe Render] mySymbol:', mySymbol);

  // Defensive check for board shape and mySymbol
  if (!game || mySymbol == null || !Array.isArray(board) || board.length !== 3 || board.some(row => !Array.isArray(row) || row.length !== 3)) {
    return <div>Loading game...</div>;
  }

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
              You are: <span className="font-bold text-yellow-500 text-lg">{mySymbol}</span>
            </div>
            <div className={`font-bold text-lg ${isMyTurnForReal ? 'text-green-500' : 'text-red-500'}`}>
              {isMyTurnForReal ? 'Your turn!' : "Opponent's turn"}
            </div>
            <div className="text-xs text-slate-400">
              Current turn: {turn} | Game started: {gameStarted ? 'Yes' : 'No'}
            </div>
          </div>
        ) : null}
      </div>
      
      {/* Mobile-First Game Board */}
      <div className="grid grid-cols-3 w-full max-w-xs border-4 border-yellow-400 rounded-lg shadow-xl bg-gradient-to-br from-slate-900 to-slate-700 mb-4">
        {board.map((rowArr, row) =>
          rowArr.map((cell, col) => (
            <div
              key={row + '-' + col}
              className={`aspect-square w-full flex items-center justify-center text-2xl sm:text-3xl cursor-pointer border font-bold ${
                cell ? 'text-yellow-500' : 'text-slate-400'
              } ${
                isMyTurnForReal && !cell && !winner ? 'hover:bg-slate-600 active:bg-slate-500' : ''
              } transition-colors duration-200 touch-manipulation`}
              onClick={() => handleCellClick(row, col)}
              style={{ minHeight: '80px' }}
            >
              {cell}
            </div>
          ))
        )}
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
