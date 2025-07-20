import { useIsMobile } from '@/hooks/use-mobile';
import { ConnectFourAI } from '@/lib/games/ConnectFourAI';
import { ConnectFourGame } from '@/lib/games/ConnectFourGame';
import { socket } from '@/lib/socket';
import { useEffect, useState } from 'react';

export function ConnectFour({ roomName, user, isMyTurn, playMode, onGameEnd }: { roomName: string, user: any, isMyTurn: boolean, playMode: 'player' | 'computer', onGameEnd?: () => void }) {
  const [game, setGame] = useState<ConnectFourGame | null>(null);
  const [board, setBoard] = useState<string[][]>([]);
  const [turn, setTurn] = useState('R');
  const [winner, setWinner] = useState<string|null>(null);
  const [mySymbol, setMySymbol] = useState<string>('R');
  const [gameStarted, setGameStarted] = useState(false);
  const isMobile = useIsMobile();

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
        const bestMove = ConnectFourAI.getBestMove(game.board, 'Y');
        if (bestMove !== null) {
          game.makeMove(bestMove);
          setBoard([...game.board]);
          setTurn(game.currentPlayer);
          setWinner(game.winner);
        }
      }, 600);
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
        const newGame = new ConnectFourGame();
        setGame(newGame);
        setBoard(newGame.board);
        setTurn(newGame.currentPlayer);
        setWinner(null);
        setMySymbol('R');
        setGameStarted(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [winner, playMode]);

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

  const isMyTurnForReal = playMode === 'player' ? turn === mySymbol : turn === 'R';

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
              You are: <span className={`font-bold text-lg ${mySymbol === 'R' ? 'text-red-500' : 'text-yellow-500'}`}>{mySymbol === 'R' ? 'Red' : 'Yellow'}</span>
            </div>
            <div className={`font-bold text-lg ${isMyTurnForReal ? 'text-green-500' : 'text-red-500'}`}>
              {isMyTurnForReal ? 'Your turn!' : "Opponent's turn"}
            </div>
          </div>
        ) : null}
      </div>

      {/* Board */}
      <div className="bg-blue-800 p-2 rounded-lg shadow-lg">
        <div className="grid grid-cols-7 gap-1">
          {board.map((row, r) =>
            row.map((cell, c) => (
              <div key={`${r}-${c}`} className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-slate-900 rounded-full"
                onClick={() => handleColumnClick(c)}
              >
                {cell && (
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${cell === 'R' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                )}
              </div>
            ))
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
