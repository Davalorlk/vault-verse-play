import { socket } from '@/lib/socket';
import { useEffect, useState } from 'react';

const ROWS = 8;
const COLS = 8;

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
      console.log('Dot and Box: Joining game room:', roomName);
      socket.emit('join-game-room', { roomName, gameId: 'dotandbox' });
      
      socket.on('game-initialized', (data: { playerIndex: number, gameStarted: boolean }) => {
        console.log('Dot and Box game initialized:', data);
        setMyPlayerIndex(data.playerIndex);
        setGameStarted(data.gameStarted);
      });
      
      const handleGameState = (state: any) => {
        console.log('Dot and Box game state update received:', state);
        if (
          state.lines &&
          Array.isArray(state.lines) &&
          state.lines.length === ROWS + 1 + ROWS &&
          state.lines.every(row => Array.isArray(row)) &&
          state.boxes &&
          Array.isArray(state.boxes) &&
          state.boxes.length === ROWS &&
          state.boxes.every(row => Array.isArray(row) && row.length === COLS)
        ) {
          setLines(state.lines);
          setBoxes(state.boxes);
          setTurn(state.turn);
          setWinner(state.winner);
        } else {
          console.warn('Received malformed lines/boxes state:', state.lines, state.boxes);
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

  useEffect(() => {
    if (playMode === 'computer' && winner) {
      const timer = setTimeout(() => {
        setLines(initialLines);
        setBoxes(initialBoxes);
        setTurn(0);
        setScores([0, 0]);
        setWinner(null);
        setGameStarted(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [winner, playMode]);

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
    
    console.log(`Dot and Box: Making move ${type} at ${i},${j} as Player ${myPlayerIndex + 1}`);
    
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
    
    const nextTurn = boxClaimed ? turn : getNextTurn(turn);
    
    setLines(newLines);
    setBoxes(newBoxes);
    setTurn(nextTurn);
    
    if (playMode === 'player') {
      console.log('Emitting Dot and Box game state update:', {
        lines: newLines,
        boxes: newBoxes,
        turn: nextTurn,
        winner: winner
      });
      socket.emit('game-state-update', {
        roomName,
        gameId: 'dotandbox',
        state: { 
          lines: newLines, 
          boxes: newBoxes, 
          turn: nextTurn,
          winner: winner
        }
      });
    }
  }

  const isMyTurnToPlay = playMode === 'computer' || (playMode === 'player' && turn === myPlayerIndex && gameStarted);

  // Board sizing
  const cell = 48; // px, larger for better visibility
  const dot = 10; // px
  const lineThickness = 6; // px
  const boardWidth = COLS * cell + dot;
  const boardHeight = ROWS * cell + dot;

  // Defensive check for lines and boxes shape
  if (
    !Array.isArray(lines) ||
    lines.length !== ROWS + 1 + ROWS ||
    lines.some(row => !Array.isArray(row)) ||
    !Array.isArray(boxes) ||
    boxes.length !== ROWS ||
    boxes.some(row => !Array.isArray(row) || row.length !== COLS)
  ) {
    return <div>Loading game...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-2 md:px-4">
      {/* Status Display */}
      {playMode === 'player' && (
        <div className="mb-4 text-center w-full max-w-md">
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
            </div>
          )}
        </div>
      )}

      {/* Score Display */}
      <div className="mb-4 text-center">
        <div className="text-white text-base sm:text-lg">
          Player 1: <span className="font-bold text-blue-400">{scores[0]}</span> | 
          Player 2: <span className="font-bold text-red-400">{scores[1]}</span>
        </div>
        {winner && (
          <div className="text-green-500 font-bold text-lg sm:text-xl mt-2">
            {playMode === 'computer' ? `Winner: ${winner}` :
             winner === `Player ${myPlayerIndex + 1}` ? 'You won! 🎉' : 
             winner === 'Draw' ? 'It\'s a draw!' : 'You lost! 😢'}
          </div>
        )}
      </div>

      {/* Game Board - Improved responsive design */}
      <div
        className="bg-gradient-to-br from-slate-900 to-slate-700 p-4 rounded-lg shadow-xl border-2 border-yellow-400 flex items-center justify-center"
        style={{ width: boardWidth + 32, height: boardHeight + 32, minWidth: 340, minHeight: 340 }}
      >
        <svg
          width={boardWidth}
          height={boardHeight}
          style={{ display: 'block', margin: 'auto' }}
        >
          {/* Draw horizontal lines */}
          {Array.from({ length: ROWS + 1 }).map((_, r) =>
            Array.from({ length: COLS }).map((_, c) =>
              lines[r][c] ? (
                <rect
                  key={`h-${r}-${c}`}
                  x={c * cell + dot / 2}
                  y={r * cell + dot / 2 - lineThickness / 2}
                  width={cell}
                  height={lineThickness}
                  rx={lineThickness / 2}
                  fill="#fbbf24"
                  stroke="#b45309"
                  strokeWidth={2}
                  onClick={() => isMyTurnToPlay && !winner && handleLineClick('h', r, c)}
                  style={{ cursor: isMyTurnToPlay && !winner ? 'pointer' : 'default' }}
                />
              ) : (
                <rect
                  key={`h-${r}-${c}`}
                  x={c * cell + dot / 2}
                  y={r * cell + dot / 2 - lineThickness / 2}
                  width={cell}
                  height={lineThickness}
                  rx={lineThickness / 2}
                  fill="#334155"
                  stroke="#64748b"
                  strokeWidth={1}
                  onClick={() => isMyTurnToPlay && !winner && handleLineClick('h', r, c)}
                  style={{ cursor: isMyTurnToPlay && !winner ? 'pointer' : 'default' }}
                />
              )
            )
          )}
          {/* Draw vertical lines */}
          {Array.from({ length: ROWS }).map((_, r) =>
            Array.from({ length: COLS + 1 }).map((_, c) =>
              lines[ROWS + 1 + r][c] ? (
                <rect
                  key={`v-${r}-${c}`}
                  x={c * cell + dot / 2 - lineThickness / 2}
                  y={r * cell + dot / 2}
                  width={lineThickness}
                  height={cell}
                  rx={lineThickness / 2}
                  fill="#fbbf24"
                  stroke="#b45309"
                  strokeWidth={2}
                  onClick={() => isMyTurnToPlay && !winner && handleLineClick('v', r, c)}
                  style={{ cursor: isMyTurnToPlay && !winner ? 'pointer' : 'default' }}
                />
              ) : (
                <rect
                  key={`v-${r}-${c}`}
                  x={c * cell + dot / 2 - lineThickness / 2}
                  y={r * cell + dot / 2}
                  width={lineThickness}
                  height={cell}
                  rx={lineThickness / 2}
                  fill="#334155"
                  stroke="#64748b"
                  strokeWidth={1}
                  onClick={() => isMyTurnToPlay && !winner && handleLineClick('v', r, c)}
                  style={{ cursor: isMyTurnToPlay && !winner ? 'pointer' : 'default' }}
                />
              )
            )
          )}
          {/* Draw dots */}
          {Array.from({ length: ROWS + 1 }).map((_, r) =>
            Array.from({ length: COLS + 1 }).map((_, c) => (
              <circle
                key={`dot-${r}-${c}`}
                cx={c * cell + dot / 2}
                cy={r * cell + dot / 2}
                r={dot / 2}
                fill="#fbbf24"
                stroke="#b45309"
                strokeWidth={2}
              />
            ))
          )}
          {/* Draw boxes */}
          {Array.from({ length: ROWS }).map((_, r) =>
            Array.from({ length: COLS }).map((_, c) =>
              boxes[r][c] > 0 ? (
                <rect
                  key={`box-${r}-${c}`}
                  x={c * cell + dot / 2 + 4}
                  y={r * cell + dot / 2 + 4}
                  width={cell - 8}
                  height={cell - 8}
                  rx={8}
                  fill={boxes[r][c] === 1 ? '#60a5fa' : '#f87171'}
                  opacity={0.3}
                />
              ) : null
            )
          )}
        </svg>
      </div>

      {winner && (
        <button
          className="mt-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-green-700 transition-colors font-semibold"
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
