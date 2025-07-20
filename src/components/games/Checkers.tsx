import { useIsMobile } from '@/hooks/use-mobile';
import { CheckersAI } from '@/lib/games/CheckersAI';
import { CheckersGame } from '@/lib/games/CheckersGame';
import { socket } from '@/lib/socket';
import { useEffect, useState } from 'react';

export function Checkers({ roomName, user, isMyTurn, playMode, onGameEnd }: { roomName: string, user: any, isMyTurn: boolean, playMode: 'player' | 'computer', onGameEnd?: () => void }) {
  const [game, setGame] = useState<CheckersGame | null>(null);
  const [board, setBoard] = useState<string[][]>([]);
  const [turn, setTurn] = useState('w');
  const [selected, setSelected] = useState<{row: number, col: number} | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<any[]>([]);
  const [winner, setWinner] = useState<string|null>(null);
  const [mySymbol, setMySymbol] = useState<string>('w');
  const [gameStarted, setGameStarted] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const newGame = new CheckersGame();
    setGame(newGame);
    setBoard(newGame.board);
    setTurn(newGame.currentPlayer);
  }, []);

  useEffect(() => {
    if (playMode === 'player' && game) {
      console.log('Checkers: Joining game room:', roomName);
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
        const bestMove = CheckersAI.getBestMove(game.board, 'b');
        if (bestMove) {
          game.makeMove(bestMove.from, bestMove.to);
          setBoard([...game.board]);
          setTurn(game.currentPlayer);
          setWinner(game.winner);
        }
      }, 700);
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
        const newGame = new CheckersGame();
        setGame(newGame);
        setBoard(newGame.board);
        setTurn(newGame.currentPlayer);
        setWinner(null);
        setMySymbol('w');
        setGameStarted(true);
        setSelected(null);
        setPossibleMoves([]);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [winner, playMode]);

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

  const isMyTurnForReal = playMode === 'player' ? turn === mySymbol : turn === 'w';

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
              You are: <span className={`font-bold text-lg ${mySymbol === 'w' ? 'text-white' : 'text-red-500'}`}>{mySymbol === 'w' ? 'White' : 'Red'}</span>
            </div>
            <div className={`font-bold text-lg ${isMyTurnForReal ? 'text-green-500' : 'text-red-500'}`}>
              {isMyTurnForReal ? 'Your turn!' : "Opponent's turn"}
            </div>
          </div>
        ) : null}
      </div>

      {/* Board */}
      <div className="bg-slate-800 p-2 rounded-lg shadow-lg">
        {board.map((row, r) => (
          <div key={r} className="flex">
            {row.map((cell, c) => (
              <div
                key={c}
                className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center ${
                  (r + c) % 2 === 0 ? 'bg-slate-600' : 'bg-slate-400'
                } ${possibleMoves.some(m => m.to.row === r && m.to.col === c) ? 'bg-yellow-400/50' : ''}`}
                onClick={() => handleCellClick(r, c)}
              >
                {cell && (
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                      cell.toLowerCase() === 'w' ? 'bg-white' : 'bg-red-700'
                    } ${selected && selected.row === r && selected.col === c ? 'border-4 border-yellow-400' : ''}`}
                  >
                    {cell.toLowerCase() !== cell && <div className="w-4 h-4 rounded-full bg-yellow-400" />}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
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
