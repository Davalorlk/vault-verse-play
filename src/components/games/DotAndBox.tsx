
import { useEffect, useState } from 'react';
import { socket } from '@/lib/socket';

const ROWS = 4; // Reduced from 7 to 4 for better mobile experience
const COLS = 4; // Reduced from 7 to 4 for better mobile experience

function getNextTurn(turn: number) {
  return turn === 0 ? 1 : 0;
}

function getCompletedBoxes(lines: boolean[][], prevBoxes: number[][], turn: number, rows: number, cols: number) {
  const boxes = prevBoxes.map(row => [...row]);
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (
        lines[i][j] && // top
        lines[rows+1+i][j] && // left
        lines[i+1][j] && // bottom
        lines[rows+1+i][j+1] // right
      ) {
        if (!boxes[i][j]) boxes[i][j] = turn + 1;
      }
    }
  }
  return boxes;
}

function getBestDotAndBoxMove(lines: boolean[][], boxes: any[][], turn: number, rows: number, cols: number) {
  // 1. Try to complete a box
  for (let i = 0; i < rows+1; i++) for (let j = 0; j < cols; j++) {
    if (!lines[i][j]) {
      const newLines = lines.map(arr => [...arr]);
      newLines[i][j] = true;
      let completed = false;
      for (let x = 0; x < rows; x++) for (let y = 0; y < cols; y++) {
        if (!boxes[x][y] &&
          newLines[x][y] && newLines[x+1][y] && newLines[rows+1+x][y] && newLines[rows+1+x][y+1]) {
          completed = true;
        }
      }
      if (completed) return ['h', i, j];
    }
  }
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols+1; j++) {
    if (!lines[rows+1+i][j]) {
      const newLines = lines.map(arr => [...arr]);
      newLines[rows+1+i][j] = true;
      let completed = false;
      for (let x = 0; x < rows; x++) for (let y = 0; y < cols; y++) {
        if (!boxes[x][y] &&
          newLines[x][y] && newLines[x+1][y] && newLines[rows+1+x][y] && newLines[rows+1+x][y+1]) {
          completed = true;
        }
      }
      if (completed) return ['v', i, j];
    }
  }
  // 2. Otherwise, pick a move that does NOT give a box if possible
  for (let i = 0; i < rows+1; i++) for (let j = 0; j < cols; j++) {
    if (!lines[i][j]) {
      const newLines = lines.map(arr => [...arr]);
      newLines[i][j] = true;
      let givesBox = false;
      for (let x = 0; x < rows; x++) for (let y = 0; y < cols; y++) {
        if (!boxes[x][y]) {
          let count = 0;
          if (newLines[x][y]) count++;
          if (newLines[x+1][y]) count++;
          if (newLines[rows+1+x][y]) count++;
          if (newLines[rows+1+x][y+1]) count++;
          if (count === 4) givesBox = true;
        }
      }
      if (!givesBox) return ['h', i, j];
    }
  }
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols+1; j++) {
    if (!lines[rows+1+i][j]) {
      const newLines = lines.map(arr => [...arr]);
      newLines[rows+1+i][j] = true;
      let givesBox = false;
      for (let x = 0; x < rows; x++) for (let y = 0; y < cols; y++) {
        if (!boxes[x][y]) {
          let count = 0;
          if (newLines[x][y]) count++;
          if (newLines[x+1][y]) count++;
          if (newLines[rows+1+x][y]) count++;
          if (newLines[rows+1+x][y+1]) count++;
          if (count === 4) givesBox = true;
        }
      }
      if (!givesBox) return ['v', i, j];
    }
  }
  // 3. Otherwise, pick any available move
  for (let i = 0; i < rows+1; i++) for (let j = 0; j < cols; j++) if (!lines[i][j]) return ['h', i, j];
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols+1; j++) if (!lines[rows+1+i][j]) return ['v', i, j];
  return null;
}

export function DotAndBox({ roomName, user, isMyTurn, playMode }: { roomName: string, user: any, isMyTurn: boolean, playMode: 'player' | 'computer' }) {
  const initialLines = Array(ROWS+1).fill(0).map(() => Array(COLS).fill(false)).concat(Array(ROWS).fill(0).map(() => Array(COLS+1).fill(false)));
  const initialBoxes = Array(ROWS).fill(0).map(() => Array(COLS).fill(0));

  const [lines, setLines] = useState(initialLines);
  const [boxes, setBoxes] = useState(initialBoxes);
  const [turn, setTurn] = useState(0);
  const [scores, setScores] = useState([0, 0]);
  const [winner, setWinner] = useState<string|null>(null);
  const [myPlayerIndex, setMyPlayerIndex] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    if (playMode === 'player') {
      socket.emit('join-game-room', { roomName, gameId: 'dotandbox' });
      
      socket.on('game-initialized', (data: { playerIndex: number, gameStarted: boolean }) => {
        console.log('Dot and Box game initialized:', data);
        setMyPlayerIndex(data.playerIndex);
        setGameStarted(data.gameStarted);
      });
      
      const handleGameState = (state: any) => {
        console.log('Dot and Box game state update received:', state);
        if (state.lines && state.boxes !== undefined) {
          setLines(state.lines);
          setBoxes(state.boxes);
          setTurn(state.turn);
          setWinner(state.winner);
        }
      };
      
      const handlePlayerJoined = (data: { playersCount: number }) => {
        console.log('Dot and Box player joined:', data);
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
    } else {
      setLines(initialLines);
      setBoxes(initialBoxes);
      setTurn(0);
      setGameStarted(true);
    }
  }, [roomName, playMode]);

  useEffect(() => {
    // Calculate scores and winner
    let p0 = 0, p1 = 0;
    for (let i = 0; i < ROWS; i++) for (let j = 0; j < COLS; j++) {
      if (boxes[i][j] === 0) continue;
      if (boxes[i][j] === 1) p0++;
      if (boxes[i][j] === 2) p1++;
    }
    setScores([p0, p1]);
    if (p0 + p1 === ROWS * COLS) {
      setWinner(p0 > p1 ? 'Player 1' : p1 > p0 ? 'Player 2' : 'Draw');
    }
  }, [boxes]);

  useEffect(() => {
    // Computer move for Dots and Boxes
    if (playMode === 'computer' && turn === 1 && winner === null && gameStarted) {
      setTimeout(() => {
        const move = getBestDotAndBoxMove(lines, boxes, 1, ROWS, COLS);
        if (move) {
          handleLineClick(move[0] as 'h' | 'v', move[1] as number, move[2] as number);
        }
      }, 700);
    }
  }, [lines, boxes, turn, playMode, winner, gameStarted]);

  function handleLineClick(type: 'h'|'v', i: number, j: number) {
    if (winner !== null) return;
    
    if (playMode === 'player') {
      if (!gameStarted) {
        console.log('Dot and Box game not started yet, waiting for another player...');
        return;
      }
      if (turn !== myPlayerIndex) {
        console.log(`Not your turn! Current turn: ${turn}, Your player index: ${myPlayerIndex}`);
        return;
      }
    }
    
    // Check if line already exists
    if ((type === 'h' && lines[i][j]) || (type === 'v' && lines[ROWS+1+i][j])) {
      return;
    }
    
    const newLines = lines.map(arr => [...arr]);
    if (type === 'h') newLines[i][j] = true;
    else newLines[ROWS+1+i][j] = true;
    
    const newBoxes = getCompletedBoxes(newLines, boxes, turn, ROWS, COLS);
    
    let boxClaimed = false;
    for (let x = 0; x < ROWS; x++) for (let y = 0; y < COLS; y++) {
      if (newBoxes[x][y] !== boxes[x][y] && newBoxes[x][y] !== 0) {
        boxClaimed = true;
      }
    }
    
    setLines(newLines);
    setBoxes(newBoxes);
    
    // If no box was claimed, switch turns
    if (!boxClaimed) {
      setTurn(getNextTurn(turn));
    }
    
    if (playMode === 'player') {
      console.log('Emitting Dot and Box game state update:', {
        lines: newLines,
        boxes: newBoxes,
        turn: boxClaimed ? turn : getNextTurn(turn),
        winner: winner
      });
      socket.emit('game-state-update', {
        roomName,
        gameId: 'dotandbox',
        state: { 
          lines: newLines, 
          boxes: newBoxes, 
          turn: boxClaimed ? turn : getNextTurn(turn),
          winner: winner
        }
      });
    }
  }

  const isMyTurnToPlay = playMode === 'computer' || (playMode === 'player' && turn === myPlayerIndex && gameStarted);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-3">
      {/* Status Display */}
      {playMode === 'player' && (
        <div className="mb-4 text-center w-full">
          {!gameStarted ? (
            <div className="text-yellow-500 font-bold text-sm sm:text-base p-3 bg-slate-800/50 rounded-lg">
              Waiting for another player to join...
            </div>
          ) : (
            <div className="space-y-2 p-3 bg-slate-800/50 rounded-lg">
              <div className="text-white text-sm">
                You are: <span className="font-bold text-yellow-500 text-lg">Player {myPlayerIndex + 1}</span>
              </div>
              <div className={`font-bold text-sm sm:text-base ${isMyTurnToPlay ? 'text-green-500' : 'text-red-500'}`}>
                {isMyTurnToPlay ? 'Your turn!' : `Waiting for Player ${turn + 1} to move...`}
              </div>
              <div className="text-xs text-slate-400">
                Current turn: Player {turn + 1} | Game started: {gameStarted ? 'Yes' : 'No'}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Score Display */}
      <div className="mb-4 text-center">
        <div className="text-white text-lg">
          Player 1: <span className="font-bold text-blue-400">{scores[0]}</span> | 
          Player 2: <span className="font-bold text-red-400">{scores[1]}</span>
        </div>
        {winner && (
          <div className="text-green-500 font-bold text-xl mt-2">
            {playMode === 'computer' ? `Winner: ${winner}` :
             winner === `Player ${myPlayerIndex + 1}` ? 'You won! 🎉' : 
             winner === 'Draw' ? 'It\'s a draw!' : 'You lost! 😢'}
          </div>
        )}
      </div>

      {/* Game Board */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-700 p-4 rounded-lg shadow-xl border-2 border-yellow-400">
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${COLS + 1}, 1fr)` }}>
          {Array.from({ length: (ROWS + 1) * (COLS + 1) }, (_, index) => {
            const row = Math.floor(index / (COLS + 1));
            const col = index % (COLS + 1);
            
            return (
              <div key={index} className="relative w-8 h-8 flex items-center justify-center">
                {/* Dot */}
                <div className="w-2 h-2 bg-yellow-400 rounded-full z-10"></div>
                
                {/* Horizontal line */}
                {col < COLS && (
                  <div
                    className={`absolute left-full w-6 h-1 cursor-pointer transition-colors ${
                      lines[row][col] ? 'bg-yellow-400' : 'bg-slate-600 hover:bg-slate-500'
                    } ${isMyTurnToPlay && !winner ? 'hover:bg-yellow-300' : ''}`}
                    onClick={() => isMyTurnToPlay && !winner && handleLineClick('h', row, col)}
                  />
                )}
                
                {/* Vertical line */}
                {row < ROWS && (
                  <div
                    className={`absolute top-full h-6 w-1 cursor-pointer transition-colors ${
                      lines[ROWS + 1 + row][col] ? 'bg-yellow-400' : 'bg-slate-600 hover:bg-slate-500'
                    } ${isMyTurnToPlay && !winner ? 'hover:bg-yellow-300' : ''}`}
                    onClick={() => isMyTurnToPlay && !winner && handleLineClick('v', row, col)}
                  />
                )}
                
                {/* Box */}
                {row < ROWS && col < COLS && (
                  <div
                    className={`absolute top-full left-full w-6 h-6 flex items-center justify-center text-xs font-bold transition-colors ${
                      boxes[row][col] === 1 ? 'bg-blue-400 text-white' :
                      boxes[row][col] === 2 ? 'bg-red-400 text-white' :
                      'bg-transparent'
                    }`}
                  >
                    {boxes[row][col] > 0 ? boxes[row][col] : ''}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {winner && (
        <button
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
          onClick={() => {
            setLines(initialLines);
            setBoxes(initialBoxes);
            setTurn(0);
            setScores([0, 0]);
            setWinner(null);
            setGameStarted(playMode === 'computer');
            if (playMode === 'player') {
              socket.emit('reset-game', { roomName, gameId: 'dotandbox' });
            }
          }}
        >
          Play Again
        </button>
      )}
    </div>
  );
}
