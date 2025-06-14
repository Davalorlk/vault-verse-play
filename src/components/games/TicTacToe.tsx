import { useEffect, useState } from 'react';
import { socket } from '@/lib/socket';
import { Client } from 'boardgame.io/react';
import { TicTacToe as TicTacToeGame } from '@/lib/games/TicTacToeGame';

function TicTacToeBoard({ G, ctx, moves, isActive }: any) {
  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    if (ctx.gameover) {
      if (ctx.gameover.winner !== undefined) {
        setWinner(ctx.gameover.winner === '0' ? 'X' : 'O');
      } else if (ctx.gameover.draw) {
        setWinner('Draw');
      }
    }
  }, [ctx.gameover]);

  function handleCellClick(id: number) {
    if (G.cells[id] !== null || !isActive || ctx.gameover) return;
    moves.clickCell(id);
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      {winner && (
        <div className="text-xl font-bold text-yellow-400 mb-4">
          {winner === 'Draw' ? "It's a Draw!" : `${winner} Wins!`}
        </div>
      )}
      <div className="text-white mb-4">
        {!ctx.gameover && (
          <span>Current Player: {ctx.currentPlayer === '0' ? 'X' : 'O'}</span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 bg-slate-800 p-4 rounded-lg">
        {G.cells.map((cell: string | null, index: number) => (
          <button
            key={index}
            className="w-20 h-20 bg-slate-700 border-2 border-slate-600 rounded-lg flex items-center justify-center text-3xl font-bold text-white hover:bg-slate-600 transition-colors disabled:cursor-not-allowed"
            onClick={() => handleCellClick(index)}
            disabled={cell !== null || !isActive || ctx.gameover}
          >
            {cell}
          </button>
        ))}
      </div>
      {ctx.gameover && (
        <button
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
          onClick={() => window.location.reload()}
        >
          Play Again
        </button>
      )}
    </div>
  );
}

const TicTacToeClient = Client({
  game: TicTacToeGame,
  board: TicTacToeBoard,
});

export function TicTacToe({ roomName, user, isMyTurn, playMode }: { roomName: string, user: any, isMyTurn: boolean, playMode: 'player' | 'computer' }) {
  const [gameID] = useState(() => roomName || 'default');
  const [playerID] = useState(() => user.id?.slice(-1) === '1' ? '1' : '0');

  if (playMode === 'computer') {
    // For computer mode, use a simpler local implementation
    return <SimpleTicTacToe />;
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      <TicTacToeClient gameID={gameID} playerID={playerID} />
    </div>
  );
}

// Simple local version for computer play
function SimpleTicTacToe() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    if (currentPlayer === 'O' && !winner) {
      // Computer move
      setTimeout(() => {
        const availableMoves = board.map((cell, index) => cell === null ? index : null).filter(val => val !== null);
        if (availableMoves.length > 0) {
          const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)] as number;
          makeMove(randomMove);
        }
      }, 500);
    }
  }, [currentPlayer, winner, board]);

  const checkWinner = (board: any[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    
    for (let line of lines) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    
    if (board.every(cell => cell !== null)) {
      return 'Draw';
    }
    
    return null;
  };

  const makeMove = (index: number) => {
    if (board[index] || winner) return;
    
    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);
    
    const gameWinner = checkWinner(newBoard);
    if (gameWinner) {
      setWinner(gameWinner);
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      {winner && (
        <div className="text-xl font-bold text-yellow-400 mb-4">
          {winner === 'Draw' ? "It's a Draw!" : `${winner} Wins!`}
        </div>
      )}
      <div className="text-white mb-4">
        {!winner && <span>Current Player: {currentPlayer}</span>}
      </div>
      <div className="grid grid-cols-3 gap-2 bg-slate-800 p-4 rounded-lg">
        {board.map((cell, index) => (
          <button
            key={index}
            className="w-20 h-20 bg-slate-700 border-2 border-slate-600 rounded-lg flex items-center justify-center text-3xl font-bold text-white hover:bg-slate-600 transition-colors disabled:cursor-not-allowed"
            onClick={() => makeMove(index)}
            disabled={cell !== null || winner !== null || currentPlayer === 'O'}
          >
            {cell}
          </button>
        ))}
      </div>
      {winner && (
        <button
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
          onClick={() => {
            setBoard(Array(9).fill(null));
            setCurrentPlayer('X');
            setWinner(null);
          }}
        >
          Play Again
        </button>
      )}
    </div>
  );
}
