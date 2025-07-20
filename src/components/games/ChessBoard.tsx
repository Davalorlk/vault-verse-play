import { useIsMobile } from '@/hooks/use-mobile';
import { ChessGame } from '@/lib/games/ChessGame';
import { socket } from '@/lib/socket';
import { useEffect, useRef, useState } from 'react';
// @ts-ignore

const pieceSymbols: Record<string, string> = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
};

export function ChessBoard({ roomName, user, isMyTurn, playMode, onGameEnd }: { roomName: string, user: any, isMyTurn: boolean, playMode: 'player' | 'computer', onGameEnd?: () => void }) {
  const [chess, setChess] = useState<ChessGame | null>(null);
  const [board, setBoard] = useState<string[][]>([]);
  const [selected, setSelected] = useState<{row: number, col: number} | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<{row:number,col:number}[]>([]);
  const [winner, setWinner] = useState<string|null>(null);
  const [turn, setTurn] = useState('white');
  const [mySymbol, setMySymbol] = useState<string>('white');
  const [gameStarted, setGameStarted] = useState(false);
  const isMobile = useIsMobile();
  const engine = useRef<any>(null);

  useEffect(() => {
    const game = new ChessGame();
    setChess(game);
    setBoard(game.board);
    setTurn(game.currentPlayer);
    console.log('Chess game initialized with board:', game.board);
  }, []);

  useEffect(() => {
    if (playMode === 'player' && chess) {
      console.log('Chess: Joining game room:', roomName);
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
          setTurn(chess.currentPlayer);
          setWinner(chess.winner);
          console.log('Chess board updated from FEN:', chess.fen());
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
        setWinner(chess.currentPlayer === 'white' ? 'Black' : 'White');
      } else {
        setWinner('Draw');
      }
      if (onGameEnd) {
        onGameEnd();
      }
    }
  }, [chess, board, onGameEnd]);

  useEffect(() => {
    if (playMode === 'computer' && chess && turn === 'black' && !winner) {
      const fen = chess.fen();
      let bestMove: string | null = null;
      let resolved = false;
      try {
        engine.current.postMessage('ucinewgame');
        engine.current.postMessage('position fen ' + fen);
        engine.current.postMessage('go depth 12');
        const onMessage = (event: any) => {
          const line = typeof event === 'string' ? event : event.data;
          if (line.startsWith('bestmove') && !resolved) {
            resolved = true;
            bestMove = line.split(' ')[1];
            if (bestMove && bestMove !== '(none)') {
              // Parse move, e.g., e2e4
              const from = bestMove.slice(0, 2);
              const to = bestMove.slice(2, 4);
              const fromCoords = chess.algebraicToCoords(from);
              const toCoords = chess.algebraicToCoords(to);
              if (fromCoords && toCoords) {
                chess.move({ from, to });
                setBoard([...chess.board]);
                setTurn(chess.currentPlayer);
                setWinner(chess.winner);
              } else {
                // Fallback: reload board
                setBoard([...chess.board]);
              }
            } else {
              setBoard([...chess.board]);
            }
            engine.current.removeEventListener('message', onMessage);
          }
        };
        engine.current.addEventListener('message', onMessage);
        setTimeout(() => {
          if (!resolved) engine.current.removeEventListener('message', onMessage);
        }, 2000);
      } catch (e) {
        setBoard([...chess.board]);
      }
    }
  }, [chess, turn, playMode, winner]);

  useEffect(() => {
    if (playMode === 'computer' && winner) {
      const timer = setTimeout(() => {
        // Reset all state to initial values
        // (Assume you have a function to reset the game, or re-initialize state here)
        if (typeof onGameEnd === 'function') onGameEnd();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [winner, playMode, onGameEnd]);

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
        console.log('Selected piece:', piece, 'at', chess.algebraicNotation(row, col), 'possible moves:', moves.length);
      }
      return;
    }

    const from = chess.algebraicNotation(selected.row, selected.col);
    const to = chess.algebraicNotation(row, col);
    
    console.log(`Attempting Chess move: ${from} to ${to} as ${mySymbol}`);
    
    // Handle pawn promotion
    const piece = chess.board[selected.row][selected.col];
    let promotion: string | undefined = undefined;
    if (piece?.toLowerCase() === 'p' && (row === 0 || row === 7)) {
      promotion = prompt("Promote to (q, r, b, n)?") || 'q';
    }

    const move = chess.move({ from, to, promotion });

    if (move) {
      console.log('Chess move successful:', move);
      setBoard([...chess.board]);
      setTurn(chess.currentPlayer);
      setSelected(null);
      setPossibleMoves([]);
      
      if (playMode === 'player') {
        console.log('Emitting Chess game state update with FEN:', chess.fen());
        socket.emit('game-state-update', {
          roomName,
          gameId: 'chess',
          state: { 
            fen: chess.fen()
          }
        });
      }
    } else {
      console.log('Invalid chess move attempted');
      setSelected(null);
      setPossibleMoves([]);
    }
  }

  if (!chess || !board || board.length === 0) return <div>Loading chess...</div>;

  const isMyTurnForReal = playMode === 'player' ? turn === mySymbol : turn === 'white';
  const cellSize = isMobile ? 40 : 48;

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
              You are: <span className={`font-bold text-lg ${mySymbol === 'white' ? 'text-white' : 'text-gray-400'}`}>{mySymbol.charAt(0).toUpperCase() + mySymbol.slice(1)}</span>
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
                className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-2xl sm:text-3xl ${
                  (r + c) % 2 === 0 ? 'bg-slate-600' : 'bg-slate-400'
                } ${possibleMoves.some(m => m.row === r && m.col === c) ? 'bg-yellow-400/50' : ''}
                  ${selected && selected.row === r && selected.col === c ? 'bg-yellow-500' : ''}`}
                onClick={() => handleCellClick(r, c)}
              >
                {cell && <span className="drop-shadow-lg">{pieceSymbols[cell]}</span>}
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
