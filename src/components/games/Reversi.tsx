import { ReversiAI } from '@/lib/games/ReversiAI';
import { ReversiGame } from '@/lib/games/ReversiGame';
import { socket } from '@/lib/socket';
import { useEffect, useState } from 'react';

export function Reversi({ roomName, user, isMyTurn, playMode }: { roomName: string, user: any, isMyTurn: boolean, playMode: 'player' | 'computer' }) {
  const [game, setGame] = useState<ReversiGame | null>(null);
  const [board, setBoard] = useState<string[][]>([]);
  const [turn, setTurn] = useState('B');
  const [winner, setWinner] = useState<string|null>(null);
  const [mySymbol, setMySymbol] = useState<string>('B');
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState({ black: 2, white: 2 });

  useEffect(() => {
    const newGame = new ReversiGame();
    setGame(newGame);
    setBoard(newGame.board);
    setTurn(newGame.currentPlayer);
    setScore(newGame.getScore());
  }, []);

  useEffect(() => {
    if (playMode === 'player' && game) {
      socket.emit('join-game-room', { roomName, gameId: 'reversi' });
      
      socket.on('game-initialized', (data: { symbol: string, gameStarted: boolean }) => {
        setMySymbol(data.symbol);
        setGameStarted(data.gameStarted);
      });
      
      socket.on('game-state-update', (state: any) => {
        if (state.board) {
          game.loadState(state);
          setBoard([...game.board]);
          setTurn(game.currentPlayer);
          setWinner(game.winner);
          setScore(game.getScore());
        }
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

  useEffect(() => {
    if (game && playMode === 'computer' && turn === 'W' && !winner) {
      setTimeout(() => {
        const bestMove = ReversiAI.getBestMove(game.board, 'W');
        if (bestMove) {
          game.makeMove(bestMove.row, bestMove.col);
          setBoard([...game.board]);
          setTurn(game.currentPlayer);
          setWinner(game.winner);
          setScore(game.getScore());
        }
      }, 800);
    }
  }, [game, turn, playMode, winner]);

  useEffect(() => {
    if (playMode === 'computer' && winner) {
      const timer = setTimeout(() => {
        const newGame = new ReversiGame();
        setGame(newGame);
        setBoard(newGame.board);
        setTurn(newGame.currentPlayer);
        setWinner(null);
        setMySymbol('B');
        setGameStarted(true);
        setScore(newGame.getScore());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [winner, playMode]);

  function handleCellClick(row: number, col: number) {
    if (!game || winner) return;
    
    if (playMode === 'player') {
      if (!gameStarted) return;
      if (turn !== mySymbol) return;
    }
    
    if (game.makeMove(row, col)) {
      setBoard([...game.board]);
      setTurn(game.currentPlayer);
      setWinner(game.winner);
      setScore(game.getScore());
      
      if (playMode === 'player') {
        socket.emit('game-state-update', {
          roomName,
          gameId: 'reversi',
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

  const isMyTurnForReal = playMode === 'player' ? turn === mySymbol : turn === 'B';

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
              You are: <span className={`font-bold text-lg ${mySymbol === 'B' ? 'text-gray-800' : 'text-white'}`}>{mySymbol === 'B' ? 'Black' : 'White'}</span>
            </div>
            <div className={`font-bold text-lg ${isMyTurnForReal ? 'text-green-500' : 'text-red-500'}`}>
              {isMyTurnForReal ? 'Your turn!' : "Opponent's turn"}
            </div>
          </div>
        ) : null}
      </div>

      {/* Board */}
      <div className="bg-green-700 p-2 rounded-lg shadow-lg">
        {board.map((row, r) => (
          <div key={r} className="flex">
            {row.map((cell, c) => (
              <div
                key={c}
                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-green-600 border border-green-800 cursor-pointer"
                onClick={() => handleCellClick(r, c)}
              >
                {cell && (
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${
                      cell === 'B' ? 'bg-black' : 'bg-white'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 text-white font-bold text-lg">
        Black: {score.black} | White: {score.white}
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
