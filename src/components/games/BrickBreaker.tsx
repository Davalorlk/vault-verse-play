import { socket } from '@/lib/socket';
import { useCallback, useEffect, useRef, useState } from 'react';

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
}

interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  hits: number;
  maxHits: number;
  destroyed: boolean;
}

export function BrickBreaker({ roomName, user, isMyTurn, playMode }: { roomName: string, user: any, isMyTurn: boolean, playMode: 'player' | 'computer' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState({
    player1: { score: 0, lives: 3, paddle: { x: 200, y: 550, width: 100, height: 15 } },
    player2: { score: 0, lives: 3, paddle: { x: 200, y: 35, width: 100, height: 15 } },
    balls: [] as Ball[],
    bricks: [] as Brick[],
    gameStarted: false,
    winner: null as string | null
  });
  const [myPlayerNumber, setMyPlayerNumber] = useState<1 | 2>(1);
  const [gameStarted, setGameStarted] = useState(false);
  const animationRef = useRef<number>();
  const gameLoopRef = useRef<NodeJS.Timeout>();

  const CANVAS_WIDTH = 500;
  const CANVAS_HEIGHT = 600;
  const BALL_SPEED = 4;
  const BRICK_ROWS = 5;
  const BRICK_COLS = 10;

  // Initialize bricks
  const initializeBricks = (): Brick[] => {
    const bricks: Brick[] = [];
    const brickWidth = (CANVAS_WIDTH - 20) / BRICK_COLS;
    const brickHeight = 25;
    
    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        bricks.push({
          x: 10 + col * brickWidth,
          y: 200 + row * (brickHeight + 5),
          width: brickWidth - 2,
          height: brickHeight,
          hits: 0,
          maxHits: Math.floor(row / 2) + 1,
          destroyed: false
        });
      }
    }
    return bricks;
  };

  // Initialize game
  useEffect(() => {
    if (playMode === 'player') {
      socket.emit('join-game-room', { roomName, gameId: 'brickbreaker' });
      
      socket.on('game-initialized', (data: { symbol: string, gameStarted: boolean }) => {
        setMyPlayerNumber(data.symbol === 'X' ? 1 : 2);
        setGameStarted(data.gameStarted);
      });
      
      socket.on('game-state-update', (state: any) => {
        setGameState(state);
      });
      
      socket.on('player-joined', (data: { playersCount: number }) => {
        if (data.playersCount === 2) {
          setGameStarted(true);
          startGame();
        }
      });
      
      return () => {
        socket.off('game-state-update');
        socket.off('game-initialized');
        socket.off('player-joined');
      };
    } else {
      setGameStarted(true);
      startGame();
    }
  }, [roomName, playMode]);

  const startGame = useCallback(() => {
    const initialState = {
      player1: { score: 0, lives: 3, paddle: { x: 200, y: 550, width: 100, height: 15 } },
      player2: { score: 0, lives: 3, paddle: { x: 200, y: 35, width: 100, height: 15 } },
      balls: [
        { x: 250, y: 300, dx: BALL_SPEED, dy: BALL_SPEED, radius: 8 }
      ],
      bricks: initializeBricks(),
      gameStarted: true,
      winner: null
    };
    setGameState(initialState);
  }, []);

  // Game physics and collision detection
  const updateGame = useCallback(() => {
    setGameState(prevState => {
      if (!prevState.gameStarted || prevState.winner) return prevState;

      const newState = { ...prevState };
      const balls = [...newState.balls];

      balls.forEach((ball, ballIndex) => {
        // Update ball position
        ball.x += ball.dx;
        ball.y += ball.dy;

        // Wall collisions
        if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= CANVAS_WIDTH) {
          ball.dx = -ball.dx;
        }

        // Top and bottom boundaries
        if (ball.y - ball.radius <= 0) {
          if (playMode === 'computer') {
            ball.dy = -ball.dy;
          } else {
            // Player 2 loses a life
            newState.player2.lives--;
            if (newState.player2.lives <= 0) {
              newState.winner = 'Player 1';
            }
            ball.x = 250;
            ball.y = 300;
            ball.dy = Math.abs(ball.dy);
          }
        }
        
        if (ball.y + ball.radius >= CANVAS_HEIGHT) {
          if (playMode === 'computer') {
            ball.dy = -ball.dy;
          } else {
            // Player 1 loses a life
            newState.player1.lives--;
            if (newState.player1.lives <= 0) {
              newState.winner = 'Player 2';
            }
            ball.x = 250;
            ball.y = 300;
            ball.dy = -Math.abs(ball.dy);
          }
        }

        // Paddle collisions
        const paddle1 = newState.player1.paddle;
        const paddle2 = newState.player2.paddle;

        // Player 1 paddle collision
        if (ball.y + ball.radius >= paddle1.y &&
            ball.y - ball.radius <= paddle1.y + paddle1.height &&
            ball.x >= paddle1.x &&
            ball.x <= paddle1.x + paddle1.width) {
          ball.dy = -Math.abs(ball.dy);
          const relativeIntersectX = (ball.x - (paddle1.x + paddle1.width / 2)) / (paddle1.width / 2);
          ball.dx = relativeIntersectX * BALL_SPEED;
        }

        // Player 2 paddle collision
        if (ball.y - ball.radius <= paddle2.y + paddle2.height &&
            ball.y + ball.radius >= paddle2.y &&
            ball.x >= paddle2.x &&
            ball.x <= paddle2.x + paddle2.width) {
          ball.dy = Math.abs(ball.dy);
          const relativeIntersectX = (ball.x - (paddle2.x + paddle2.width / 2)) / (paddle2.width / 2);
          ball.dx = relativeIntersectX * BALL_SPEED;
        }

        // Brick collisions
        newState.bricks.forEach((brick, brickIndex) => {
          if (!brick.destroyed &&
              ball.x + ball.radius >= brick.x &&
              ball.x - ball.radius <= brick.x + brick.width &&
              ball.y + ball.radius >= brick.y &&
              ball.y - ball.radius <= brick.y + brick.height) {
            
            brick.hits++;
            if (brick.hits >= brick.maxHits) {
              brick.destroyed = true;
              newState.player1.score += 10;
              if (playMode === 'player') {
                newState.player2.score += 10;
              }
            }
            
            ball.dy = -ball.dy;
          }
        });
      });

      // Check if all bricks are destroyed
      const remainingBricks = newState.bricks.filter(brick => !brick.destroyed);
      if (remainingBricks.length === 0) {
        newState.winner = playMode === 'computer' ? 'Player' : 'Both Players';
      }

      return newState;
    });
  }, [playMode]);

  // Game loop
  useEffect(() => {
    if (gameStarted && gameState.gameStarted) {
      gameLoopRef.current = setInterval(updateGame, 16); // ~60 FPS
      return () => {
        if (gameLoopRef.current) {
          clearInterval(gameLoopRef.current);
        }
      };
    }
  }, [gameStarted, gameState.gameStarted, updateGame]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // Clear canvas
      ctx.fillStyle = '#0f0f23';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw paddles
      ctx.fillStyle = '#3b82f6';
      const paddle1 = gameState.player1.paddle;
      ctx.fillRect(paddle1.x, paddle1.y, paddle1.width, paddle1.height);
      
      if (playMode === 'player') {
        ctx.fillStyle = '#ef4444';
        const paddle2 = gameState.player2.paddle;
        ctx.fillRect(paddle2.x, paddle2.y, paddle2.width, paddle2.height);
      }

      // Draw bricks
      gameState.bricks.forEach(brick => {
        if (!brick.destroyed) {
          const alpha = 1 - (brick.hits / brick.maxHits) * 0.7;
          ctx.fillStyle = `rgba(251, 191, 36, ${alpha})`;
          ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
          
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1;
          ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
        }
      });

      // Draw balls
      ctx.fillStyle = '#ffffff';
      gameState.balls.forEach(ball => {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw UI
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      ctx.fillText(`Score: ${gameState.player1.score} Lives: ${gameState.player1.lives}`, 10, 30);
      if (playMode === 'player') {
        ctx.fillText(`P2 Score: ${gameState.player2.score} Lives: ${gameState.player2.lives}`, 10, CANVAS_HEIGHT - 10);
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, playMode]);

  // Handle mouse movement for paddle
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const paddleX = Math.max(0, Math.min(x - gameState.player1.paddle.width / 2, CANVAS_WIDTH - gameState.player1.paddle.width));

    setGameState(prevState => {
      const newState = { ...prevState };
      if (myPlayerNumber === 1) {
        newState.player1.paddle.x = paddleX;
      } else {
        newState.player2.paddle.x = paddleX;
      }

      if (playMode === 'player') {
        socket.emit('game-state-update', {
          roomName,
          gameId: 'brickbreaker',
          state: newState
        });
      }

      return newState;
    });
  };

  useEffect(() => {
    if (playMode === 'computer' && gameState.winner) {
      const timer = setTimeout(() => {
        startGame();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [gameState.winner, playMode]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-3 py-4">
      {/* Status Display */}
      {playMode === 'player' && (
        <div className="mb-4 text-center w-full">
          {!gameStarted ? (
            <div className="text-yellow-500 font-bold text-sm p-3 bg-slate-800/50 rounded-lg">
              Waiting for another player to join...
            </div>
          ) : (
            <div className="space-y-2 p-3 bg-slate-800/50 rounded-lg">
              <div className="text-white text-sm">
                You are: <span className="font-bold text-yellow-500 text-lg">Player {myPlayerNumber}</span>
              </div>
              <div className="text-green-500 font-bold text-sm">
                Game in progress!
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col items-center">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border-2 border-yellow-400 rounded-lg shadow-xl bg-slate-900"
          onMouseMove={handleMouseMove}
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        
        <div className="mt-4 text-center">
          <div className="text-white text-sm mb-2">
            Move your mouse to control your paddle
          </div>
          <div className="text-yellow-400 text-xs">
            {playMode === 'computer' ? 'Break all bricks to win!' : 'Player 1 (Blue) bottom | Player 2 (Red) top'}
          </div>
        </div>

        {gameState.winner && (
          <div className="mt-4 text-2xl font-bold text-green-500">
            {gameState.winner} wins! 🎉
          </div>
        )}
        
        <button 
          onClick={startGame}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600 transition"
        >
          {gameState.gameStarted ? 'Restart Game' : 'Start Game'}
        </button>
      </div>
    </div>
  );
}
