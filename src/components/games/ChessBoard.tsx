
import { useEffect, useState } from 'react';
import { socket } from '@/lib/socket';
import { ChessGame } from '@/lib/games/ChessGame';

const pieceSymbols: Record<string, string> = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
};

export function ChessBoard({ roomName, user, isMyTurn, playMode }: { roomName: string, user: any, isMyTurn: boolean, playMode: 'player' | 'computer' }) {
  const [chess, setChess] = useState<ChessGame | null>(null);
  const [board, setBoard] = useState<string[][]>([]);
  const [selected, setSelected] = useState<{row: number, col: number} | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<{row:number,col:number}[]>([]);
  const [winner, setWinner] = useState<string|null>(null);
  const [turn, setTurn] = useState('white');
  const [mySymbol, setMySymbol] = useState<string>('white');
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    const game = new ChessGame();
    setChess(game);
    setBoard(game.board);
    setTurn(game.turn);
  }, []);

  useEffect(() => {
    if (playMode === 'player' && chess) {
      socket.emit('join-game-room', { roomName, gameId: 'chess' });
      
      socket.on('game-initialized', (data: { symbol: string, gameStarted: boolean }) => {
        console.log('Chess game initialized:', data);
        setMySymbol(data.symbol);
        setGameStarted(data.gameStarted);
      });
      
      const handleGameState = (state: any) => {
        console.log('Chess game state update received:', state);
        if (state.fen) {
          chess.load(state.fen);
          setBoard([...chess.board]);
          setTurn(chess.turn);
          setWinner(chess.isGameOver() ? (chess.isCheckmate() ? (chess.turn === 'white' ? 'Black' : 'White') : 'Draw') : null);
        }
      };
      
      const handlePlayerJoined = (data: { playersCount: number }) => {
        console.log('Chess player joined:', data);
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
  }, [roomName, playMode, chess]);

  useEffect(() => {
    if (chess && chess.isGameOver()) {
      if (chess.isCheckmate()) {
        setWinner(chess.turn === 'white' ? 'Black' : 'White');
      } else {
        setWinner('Draw');
      }
    }
  }, [chess, board]);

  function handleCellClick(row: number, col: number) {
    if (!chess || winner) return;
    
    if (playMode === 'player') {
      if (!gameStarted) {
        console.log('Chess game not started yet, waiting for another player...');
        return;
      }
      if (turn !== mySymbol) {
        console.log(`Not your turn! Current turn: ${turn}, Your symbol: ${mySymbol}`);
        return;
      }
    }

    if (!selected) {
      const piece = board[row][col];
      if (piece && ((turn === 'white' && piece === piece.toUpperCase()) || (turn === 'black' && piece === piece.toLowerCase()))) {
        const moves = chess.moves({ square: chess.algebraicNotation(row, col), verbose: true });
        setPossibleMoves(moves.map((move: any) => ({
          row: chess.squareToCoords(move.to).row,
          col: chess.squareToCoords(move.to).col
        })));
        setSelected({row, col});
      }
      return;
    }

    const from = chess.algebraicNotation(selected.row, selected.col);
    const to = chess.algebraicNotation(row, col);
    
    try {
      const move = chess.move({ from, to });
      if (move) {
        console.log(`Making Chess move: ${from} to ${to} as ${mySymbol}`);
        setBoard([...chess.board]);
        setTurn(chess.turn);
        setSelected(null);
        setPossibleMoves([]);
        
        if (playMode === 'player') {
          console.log('Emitting Chess game state update:', {
            fen: chess.fen(),
            turn: chess.turn
          });
          socket.emit('game-state-update', {
            roomName,
            gameId: 'chess',
            state: { 
              fen: chess.fen(), 
              turn: chess.turn 
            }
          });
        }
      }
    } catch (error) {
      setSelected(null);
      setPossibleMoves([]);
    }
  }

  if (!chess) return <div>Loading chess...</div>;

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
                You are: <span className="font-bold text-yellow-500 text-lg">{mySymbol}</span>
              </div>
              <div className={`font-bold text-sm sm:text-base ${isMyTurnToPlay ? 'text-green-500' : 'text-red-500'}`}>
                {isMyTurnToPlay ? 'Your turn!' : `Waiting for ${turn} to move...`}
              </div>
              <div className="text-xs text-slate-400">
                Current turn: {turn} | Game started: {gameStarted ? 'Yes' : 'No'}
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="inline-block border-4 border-yellow-400 rounded-lg shadow-xl bg-gradient-to-br from-slate-900 to-slate-700 p-2">
        <div
          className="grid"
          style={{
            gridTemplateColumns: 'repeat(8, 48px)',
            gridTemplateRows: 'repeat(8, 48px)',
            gap: 0,
          }}
        >
          {board.map((rowArr, row) =>
            rowArr.map((cell, col) => {
              const isLight = (row + col) % 2 === 1;
              const isSelected = selected && selected.row === row && selected.col === col;
              const isMove = possibleMoves.some(m => m.row === row && m.col === col);
              return (
                <div
                  key={row + '-' + col}
                  className={`w-12 h-12 flex items-center justify-center text-3xl font-bold select-none cursor-pointer transition-all duration-100
                    ${isLight ? 'bg-slate-200' : 'bg-slate-600'}
                    ${isSelected ? 'ring-4 ring-yellow-400 z-10' : ''}
                    ${isMove ? 'ring-4 ring-green-400 z-10' : ''}
                    ${!isMyTurnToPlay ? 'opacity-70' : ''}`}
                  style={{ color: cell && cell === cell.toUpperCase() ? '#fff' : '#222' }}
                  onClick={() => handleCellClick(row, col)}
                >
                  {cell ? pieceSymbols[cell] : ''}
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {winner && (
        <div className="mt-4 text-center">
          <div className="text-green-500 font-bold text-lg mb-2">
            {winner === 'Draw' ? 'It\'s a draw!' : 
             playMode === 'computer' ? `Winner: ${winner}` :
             winner === mySymbol ? 'You won! 🎉' : 'You lost! 😢'}
          </div>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
            onClick={() => {
              const newGame = new ChessGame();
              setChess(newGame);
              setBoard(newGame.board);
              setTurn(newGame.turn);
              setSelected(null);
              setPossibleMoves([]);
              setWinner(null);
              setMySymbol('white');
              setGameStarted(false);
            }}
          >Replay</button>
        </div>
      )}
    </div>
  );
}
