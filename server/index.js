// Express + Socket.IO + Neon (Postgres) backend scaffold
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const cors = require('cors');

// SQL for creating tables (run these manually in your Neon DB console or migration tool):
// CREATE TABLE IF NOT EXISTS friends (
//     user_id1 VARCHAR(255) NOT NULL,
//     user_id2 VARCHAR(255) NOT NULL,
//     status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'
//     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
//     updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
//     PRIMARY KEY (user_id1, user_id2),
//     FOREIGN KEY (user_id1) REFERENCES users(uid) ON DELETE CASCADE,
//     FOREIGN KEY (user_id2) REFERENCES users(uid) ON DELETE CASCADE,
//     CHECK (user_id1 < user_id2) -- Ensures unique pairs regardless of order
// );

const app = express();
const allowedOrigins = [
  'https://fantastic-space-engine-rq4rrqj44qwfxwwr-8080.app.github.dev',
  'https://vault-verse-play.vercel.app',
  'http://localhost:5173',
  'http://localhost:8080',
  'https://vault-verse-play-opal.vercel.app'
];
app.use(cors({ 
  origin: allowedOrigins,
  credentials: true 
}));
const server = http.createServer(app);
const io = new Server(server, { 
  cors: { 
    origin: allowedOrigins,
    credentials: true 
  } 
});

// Neon Postgres connection (replace with your Neon connection string)
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_g1IsJlVdE6pt@ep-cold-lab-a8t05z3v-pooler.eastus2.azure.neon.tech/puzzle?sslmode=require',
});

app.use(express.json());

// Global request logger
app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.url}`);
  next();
});

// Example REST endpoint
dbTest = async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
app.get('/api/dbtest', dbTest);

// Test endpoint to verify deployment
app.get('/api/test-endpoint', (req, res) => {
  console.log('[/api/test-endpoint] Test endpoint hit!');
  res.json({ message: 'Test endpoint reached successfully!' });
});

// Register a new user
app.post('/api/register', async (req, res) => {
  // Log the incoming request body for debugging
  console.log('Register request body:', req.body);
  const { uid, username, displayName, avatar, rank, coins, experience, puzzlesSolved, achievements, timePlayed } = req.body;
  try {
    // Defensive: handle missing or undefined fields
    const safeRank = rank || 'Novice';
    const safeCoins = typeof coins === 'number' ? coins : 100;
    const safeExperience = typeof experience === 'number' ? experience : 0;
    const safePuzzlesSolved = typeof puzzlesSolved === 'number' ? puzzlesSolved : 0;
    const safeAchievements = Array.isArray(achievements) ? achievements : [];
    const safeTimePlayed = typeof timePlayed === 'number' ? timePlayed : 0;

    const result = await pool.query(
      `INSERT INTO users (uid, username, display_name, avatar, rank, coins, experience, puzzles_solved, achievements, time_played)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [uid, username, displayName, avatar, safeRank, safeCoins, safeExperience, safePuzzlesSolved, safeAchievements, safeTimePlayed]
    );
    res.json(result.rows[0]);
  } catch (err) {
    // Log the full error for debugging
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message, details: err });
  }
});

// Login by username
app.post('/api/login', async (req, res) => {
  const { username } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user profile by uid
app.get('/api/user/:uid', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE uid = $1', [req.params.uid]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user stats endpoint
app.put('/api/user/:uid/stats', async (req, res) => {
  const { uid } = req.params;
  const { puzzlesSolved, timePlayed, experience, coins } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE users 
       SET puzzles_solved = COALESCE($2, puzzles_solved),
           time_played = COALESCE($3, time_played),
           experience = COALESCE($4, experience),
           coins = COALESCE($5, coins)
       WHERE uid = $1
       RETURNING *`,
      [uid, puzzlesSolved, timePlayed, experience, coins]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update user stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Friend Request Endpoints
app.post('/api/friends/request', async (req, res) => {
  const { senderId, receiverId } = req.body;
  if (!senderId || !receiverId) {
    return res.status(400).json({ error: 'Sender ID and Receiver ID are required.' });
  }
  // Ensure user_id1 is always smaller for consistent primary key
  const [user1, user2] = senderId < receiverId ? [senderId, receiverId] : [receiverId, senderId];

  try {
    // Check if request already exists or they are already friends
    const existing = await pool.query(
      `SELECT * FROM friends WHERE (user_id1 = $1 AND user_id2 = $2) OR (user_id1 = $2 AND user_id2 = $1)`,
      [user1, user2]
    );

    if (existing.rows.length > 0) {
      const relationship = existing.rows[0];
      if (relationship.status === 'accepted') {
        return res.status(409).json({ error: 'Already friends.' });
      }
      if (relationship.status === 'pending' && relationship.user_id1 === senderId) {
        return res.status(409).json({ error: 'Friend request already sent.' });
      }
      if (relationship.status === 'pending' && relationship.user_id2 === senderId) {
        return res.status(409).json({ error: 'You have a pending friend request from this user. Please accept it.' });
      }
    }

    const result = await pool.query(
      `INSERT INTO friends (user_id1, user_id2, status) VALUES ($1, $2, 'pending') RETURNING *`,
      [user1, user2]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Friend request error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/friends/accept', async (req, res) => {
  const { senderId, receiverId } = req.body;
  if (!senderId || !receiverId) {
    return res.status(400).json({ error: 'Sender ID and Receiver ID are required.' });
  }
  const [user1, user2] = senderId < receiverId ? [senderId, receiverId] : [receiverId, senderId];

  try {
    const result = await pool.query(
      `UPDATE friends SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
       WHERE user_id1 = $1 AND user_id2 = $2 AND status = 'pending'
       RETURNING *`,
      [user1, user2]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pending friend request not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Accept friend request error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/friends/remove', async (req, res) => {
  const { user1Id, user2Id } = req.body; // Can be used for removing or declining
  if (!user1Id || !user2Id) {
    return res.status(400).json({ error: 'User IDs are required.' });
  }
  const [u1, u2] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];

  try {
    const result = await pool.query(
      `DELETE FROM friends WHERE user_id1 = $1 AND user_id2 = $2 RETURNING *`,
      [u1, u2]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Friend relationship not found.' });
    }
    res.json({ message: 'Friend relationship removed successfully.' });
  } catch (err) {
    console.error('Remove friend error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/friends/:uid', async (req, res) => {
  const { uid } = req.params;
  try {
    const result = await pool.query(
      `SELECT
         CASE
           WHEN f.user_id1 = $1 THEN u2.uid
           ELSE u1.uid
         END as friend_uid,
         CASE
           WHEN f.user_id1 = $1 THEN u2.display_name
           ELSE u1.display_name
         END as display_name,
         CASE
           WHEN f.user_id1 = $1 THEN u2.avatar
           ELSE u1.avatar
         END as avatar,
         f.status,
         f.created_at,
         f.updated_at
       FROM friends f
       JOIN users u1 ON f.user_id1 = u1.uid
       JOIN users u2 ON f.user_id2 = u2.uid
       WHERE f.user_id1 = $1 OR f.user_id2 = $1`,
      [uid]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get friends error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Search users by username or display name
app.get('/api/user/search', async (req, res) => {
  console.log('[/api/user/search] Search request received.');
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ error: 'Search query is required.' });
  }
  try {
    const searchQuery = `%${query.toLowerCase()}%`;
    const result = await pool.query(
      `SELECT uid, username, display_name, avatar
       FROM users
       WHERE LOWER(username) LIKE $1 OR LOWER(display_name) LIKE $1
       LIMIT 10`,
      [searchQuery]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Search users error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Fixed leaderboard endpoint with better error handling
app.get('/api/leaderboard', async (req, res) => {
  try {
    console.log('Fetching leaderboard data...');
    
    // First, let's try a simple query to see what columns exist
    const testResult = await pool.query('SELECT * FROM users LIMIT 1');
    console.log('Available columns:', Object.keys(testResult.rows[0] || {}));
    
    // Use a more robust query that handles missing columns gracefully
    const result = await pool.query(`
      SELECT *,
             (CASE 
                WHEN puzzles_solved IS NOT NULL AND time_played IS NOT NULL 
                THEN (puzzles_solved * 100.0 + time_played * 0.1)
                WHEN puzzles_solved IS NOT NULL 
                THEN (puzzles_solved * 100.0)
                ELSE 0.0
              END) as ranking_score
      FROM users 
      ORDER BY 
        (CASE 
          WHEN puzzles_solved IS NOT NULL AND time_played IS NOT NULL 
          THEN (puzzles_solved * 100.0 + time_played * 0.1)
          WHEN puzzles_solved IS NOT NULL 
          THEN (puzzles_solved * 100.0)
          ELSE 0.0
        END) DESC,
        puzzles_solved DESC NULLS LAST,
        time_played DESC NULLS LAST
      LIMIT 100
    `);
    
    console.log(`Successfully fetched ${result.rows.length} users for leaderboard`);
    res.json(result.rows);
  } catch (err) {
    console.error('Leaderboard query error:', err.message);
    console.error('Full error:', err);
    
    // Fallback: try a simple query without ranking calculation
    try {
      console.log('Attempting fallback query...');
      const fallbackResult = await pool.query(`
        SELECT * FROM users 
        ORDER BY puzzles_solved DESC NULLS LAST, time_played DESC NULLS LAST
        LIMIT 100
      `);
      console.log(`Fallback query successful with ${fallbackResult.rows.length} users`);
      res.json(fallbackResult.rows);
    } catch (fallbackErr) {
      console.error('Fallback query also failed:', fallbackErr.message);
      res.status(500).json({ 
        error: 'Database query failed', 
        details: err.message,
        fallbackError: fallbackErr.message 
      });
    }
  }
});

// In-memory presence tracking
const onlineUsers = new Map(); // socket.id -> userInfo
const gameRooms = new Map(); // roomName-gameId -> { players: [], gameState: {}, gameType: string, messages: [] }

// Helper function to get game-specific initial state
function getInitialGameState(gameId) {
  switch (gameId) {
    case 'tictactoe':
      return {
        board: [['', '', ''], ['', '', ''], ['', '', '']],
        currentPlayer: 'X',
        winner: null
      };
    case 'connect4':
      return {
        board: Array(6).fill(null).map(() => Array(7).fill('')),
        currentPlayer: 'R',
        winner: null
      };
    case 'chess':
      return {
        board: [
          ['r','n','b','q','k','b','n','r'],
          ['p','p','p','p','p','p','p','p'],
          ['','','','','','','',''],
          ['','','','','','','',''],
          ['','','','','','','',''],
          ['','','','','','','',''],
          ['P','P','P','P','P','P','P','P'],
          ['R','N','B','Q','K','B','N','R']
        ],
        currentPlayer: 'white',
        winner: null
      };
    case 'checkers':
      return {
        board: [
          ['', 'b', '', 'b', '', 'b', '', 'b'],
          ['b', '', 'b', '', 'b', '', 'b', ''],
          ['', 'b', '', 'b', '', 'b', '', 'b'],
          ['', '', '', '', '', '', '', ''],
          ['', '', '', '', '', '', '', ''],
          ['w', '', 'w', '', 'w', '', 'w', ''],
          ['', 'w', '', 'w', '', 'w', '', 'w'],
          ['w', '', 'w', '', 'w', '', 'w', '']
        ],
        currentPlayer: 'w',
        winner: null
      };
    case 'gomoku':
      return {
        board: Array(15).fill(null).map(() => Array(15).fill('')),
        currentPlayer: 'X',
        winner: null
      };
    case 'dotandbox':
      const ROWS = 4, COLS = 4;
      return {
        lines: Array(ROWS+1).fill(0).map(() => Array(COLS).fill(false)).concat(Array(ROWS).fill(0).map(() => Array(COLS+1).fill(false))),
        boxes: Array(ROWS).fill(0).map(() => Array(COLS).fill(0)),
        turn: 0,
        winner: null
      };
    case 'guesswho':
      return {
        phase: 'setup',
        players: {},
        currentGuesser: 0,
        winner: null
      };
    case 'hangman':
      return {
        word: '',
        guesses: [],
        wrong: 0,
        wordSet: false,
        round: 1,
        currentGuesser: 1,
        currentWordSetter: 0,
        winner: null,
        scores: {0: 0, 1: 0}
      };
    case 'nineholes':
      return {
        board: [['', '', ''], ['', '', ''], ['', '', '']],
        turn: 'X',
        moves: 0,
        winner: null
      };
    case 'brickbreaker':
      return {
        player1: { score: 0, lives: 3, paddle: { x: 200, y: 550 } },
        player2: { score: 0, lives: 3, paddle: { x: 200, y: 50 } },
        balls: [
          { x: 250, y: 300, dx: 3, dy: 3 },
          { x: 250, y: 300, dx: -3, dy: -3 }
        ],
        bricks: [],
        gameStarted: false,
        winner: null
      };
    default:
      return { currentPlayer: 'X', winner: null };
  }
}

// Helper function to get player assignment for different games
function getPlayerAssignment(gameId, playerIndex) {
  switch (gameId) {
    case 'tictactoe':
    case 'gomoku':
    case 'nineholes':
      return { symbol: playerIndex === 0 ? 'X' : 'O' };
    case 'connect4':
      return { symbol: playerIndex === 0 ? 'R' : 'Y' };
    case 'chess':
      return { symbol: playerIndex === 0 ? 'white' : 'black' };
    case 'checkers':
      return { symbol: playerIndex === 0 ? 'w' : 'b' };
    case 'dotandbox':
      return { playerIndex: playerIndex };
    case 'guesswho':
      return { playerIndex: playerIndex };
    case 'hangman':
      return { playerIndex: playerIndex };
    case 'brickbreaker':
      return { symbol: playerIndex === 0 ? 'X' : 'O' };
    default:
      return { symbol: playerIndex === 0 ? 'X' : 'O' };
  }
}

// Example Socket.IO events
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Listen for user info (sent from client after connect)
  socket.on('user-online', (userInfo) => {
    onlineUsers.set(socket.id, userInfo);
    io.emit('presence-update', Array.from(onlineUsers.values()));
  });

  // Handle rejoining global chat
  socket.on('rejoin-global-chat', ({ user }) => {
    console.log(`User ${socket.id} rejoining global chat`);
    
    // Update user info in online users
    onlineUsers.set(socket.id, {
      uid: user.uid,
      displayName: user.displayName,
      avatar: user.avatar,
      rank: user.rank
    });
    
    // Send confirmation
    socket.emit('rejoined-global-chat', {
      success: true,
      onlineCount: onlineUsers.size
    });
    
    // Update presence for all users
    io.emit('presence-update', Array.from(onlineUsers.values()));
    
    console.log(`User ${socket.id} successfully rejoined global chat`);
  });

  // Join a game room with proper turn management
  socket.on('join-game-room', async ({ roomName, gameId }) => {
    const room = `${roomName}-${gameId}`;
    const roomKey = `${roomName}-${gameId}`;
    socket.join(room);
    console.log(`Player ${socket.id} joined room ${roomKey}`);
    // Initialize game room if it doesn't exist
    if (!gameRooms.has(roomKey)) {
      gameRooms.set(roomKey, {
        players: [],
        gameState: getInitialGameState(gameId),
        gameType: gameId,
        messages: []
      });
      console.log(`Initialized new game room ${roomKey} for ${gameId}`);
    }
    const gameRoom = gameRooms.get(roomKey);
    const userInfo = onlineUsers.get(socket.id);
    let dbUser = null;
    if (userInfo && userInfo.uid) {
      try {
        const result = await pool.query('SELECT * FROM users WHERE uid = $1', [userInfo.uid]);
        if (result.rows.length > 0) dbUser = result.rows[0];
      } catch (err) {
        console.error('Error fetching user from DB:', err);
      }
    }
    // Add player to room if not already present
    const existingPlayer = gameRoom.players.find(p => p.socketId === socket.id);
    if (!existingPlayer && gameRoom.players.length < 2) {
      const playerIndex = gameRoom.players.length;
      const playerAssignment = getPlayerAssignment(gameId, playerIndex);
      const playerInfo = {
        socketId: socket.id,
        playerIndex: playerIndex,
        uid: dbUser?.uid || userInfo?.uid,
        username: dbUser?.username || userInfo?.username || dbUser?.display_name || userInfo?.displayName || 'Anonymous',
        displayName: dbUser?.display_name || userInfo?.displayName || dbUser?.username || userInfo?.username,
        avatar: dbUser?.avatar || userInfo?.avatar || '👤',
        rank: dbUser?.rank || userInfo?.rank,
        ...playerAssignment
      };
      gameRoom.players.push(playerInfo);
      console.log(`Added player ${socket.id} as player ${playerIndex} with assignment:`, playerAssignment);
      // Notify player of their assignment
      socket.emit('game-initialized', {
        ...playerAssignment,
        gameStarted: gameRoom.players.length === 2,
        currentPlayer: gameRoom.gameState.currentPlayer
      });
      // Notify all players in room about player count and send player info
      io.to(room).emit('player-joined', {
        playersCount: gameRoom.players.length,
        player: playerInfo,
        players: gameRoom.players
      });
      // Send current game state to the new player
      socket.emit('game-state-update', gameRoom.gameState);
      console.log(`Room ${roomKey} now has ${gameRoom.players.length} players`);
    } else {
      // Always emit game-initialized to the joining player if already present
      const player = gameRoom.players.find(p => p.socketId === socket.id);
      if (player) {
        const playerAssignment = getPlayerAssignment(gameId, player.playerIndex);
        socket.emit('game-initialized', {
          ...playerAssignment,
          gameStarted: gameRoom.players.length === 2,
          currentPlayer: gameRoom.gameState.currentPlayer
        });
      }
    }
  });

  // Handle rejoining players
  socket.on('rejoin-game-room', async ({ roomName, gameId, user }) => {
    const room = `${roomName}-${gameId}`;
    const roomKey = `${roomName}-${gameId}`;
    socket.join(room);
    console.log(`Player ${socket.id} rejoining room ${roomKey}`);
    if (gameRooms.has(roomKey)) {
      const gameRoom = gameRooms.get(roomKey);
      // Find if this player was already in the room (by user ID or similar)
      let existingPlayerIndex = gameRoom.players.findIndex(p => 
        (user.uid && p.uid === user.uid) || p.socketId === socket.id
      );
      let dbUser = null;
      if (user && user.uid) {
        try {
          const result = await pool.query('SELECT * FROM users WHERE uid = $1', [user.uid]);
          if (result.rows.length > 0) dbUser = result.rows[0];
        } catch (err) {
          console.error('Error fetching user from DB (rejoin):', err);
        }
      }
      if (existingPlayerIndex === -1) {
        // Add as new player if not found and room has space
        if (gameRoom.players.length < 2) {
          const playerIndex = gameRoom.players.length;
          const playerAssignment = getPlayerAssignment(gameId, playerIndex);
          gameRoom.players.push({
            socketId: socket.id,
            uid: dbUser?.uid || user?.uid,
            playerIndex: playerIndex,
            username: dbUser?.username || user?.username || dbUser?.display_name || user?.displayName || 'Anonymous',
            displayName: dbUser?.display_name || user?.displayName || dbUser?.username || user?.username,
            avatar: dbUser?.avatar || user?.avatar || '👤',
            rank: dbUser?.rank || user?.rank,
            ...playerAssignment
          });
          existingPlayerIndex = playerIndex;
        }
      } else {
        // Update socket ID for existing player
        gameRoom.players[existingPlayerIndex].socketId = socket.id;
      }
      if (existingPlayerIndex !== -1) {
        const playerAssignment = getPlayerAssignment(gameId, existingPlayerIndex);
        // Send confirmation with current game state and messages
        socket.emit('rejoined-game-room', {
          success: true,
          gameState: gameRoom.gameState,
          messages: gameRoom.messages || [],
          ...playerAssignment,
          gameStarted: gameRoom.players.length === 2
        });
        // Always emit game-initialized to the rejoining player
        socket.emit('game-initialized', {
          ...playerAssignment,
          gameStarted: gameRoom.players.length === 2,
          currentPlayer: gameRoom.gameState.currentPlayer
        });
        // Update all players with current player list
        io.to(room).emit('room-players-update', gameRoom.players);
        // Notify other players
        socket.to(room).emit('player-rejoined', {
          playersCount: gameRoom.players.length
        });
        console.log(`Player ${socket.id} successfully rejoined room ${roomKey}`);
      } else {
        socket.emit('rejoin-failed', { reason: 'Room is full' });
      }
    } else {
      socket.emit('rejoin-failed', { reason: 'Room no longer exists' });
    }
  });

  // Handle leaving game rooms
  socket.on('leave-game-room', ({ roomName, gameId }) => {
    const room = `${roomName}-${gameId}`;
    const roomKey = `${roomName}-${gameId}`;
    
    socket.leave(room);
    
    if (gameRooms.has(roomKey)) {
      const gameRoom = gameRooms.get(roomKey);
      const playerIndex = gameRoom.players.findIndex(p => p.socketId === socket.id);
      
      if (playerIndex !== -1) {
        const leavingPlayer = gameRoom.players[playerIndex];
        gameRoom.players.splice(playerIndex, 1);
        
        // Notify remaining players
        io.to(room).emit('player-left', {
          playersCount: gameRoom.players.length,
          player: leavingPlayer,
          players: gameRoom.players
        });
        
        // Clean up empty rooms after a delay (in case player rejoins)
        if (gameRoom.players.length === 0) {
          setTimeout(() => {
            if (gameRooms.has(roomKey) && gameRooms.get(roomKey).players.length === 0) {
              gameRooms.delete(roomKey);
              console.log(`Cleaned up empty room ${roomKey}`);
            }
          }, 300000); // 5 minutes delay
        }
      }
    }
  });

  // Game state update event with turn validation
  socket.on('game-state-update', ({ roomName, gameId, state }) => {
    const room = `${roomName}-${gameId}`;
    const roomKey = `${roomName}-${gameId}`;
    
    if (gameRooms.has(roomKey)) {
      const gameRoom = gameRooms.get(roomKey);
      const player = gameRoom.players.find(p => p.socketId === socket.id);
      
      if (player) {
        console.log(`Game state update from player ${player.playerIndex} in room ${roomKey}`);
        
        // Check if game has ended
        if (state.winner) {
          // Emit game-ended event to all players in the room
          io.to(room).emit('game-ended', { winner: state.winner });
        }
        
        // Special handling for Guess Who character selection
        if (gameId === 'guesswho' && state.myCharacter && state.playerIndex !== undefined) {
          if (!gameRoom.gameState.players) {
            gameRoom.gameState.players = {};
          }
          gameRoom.gameState.players[state.playerIndex] = state.myCharacter;
          
          // Check if both players have selected characters
          if (Object.keys(gameRoom.gameState.players).length === 2) {
            gameRoom.gameState.phase = 'playing';
          }
          
          // Broadcast to other players without revealing character choices
          socket.to(room).emit('game-state-update', {
            phase: gameRoom.gameState.phase,
            playersReady: Object.keys(gameRoom.gameState.players).length
          });
        } else {
          // Update game state for other games
          gameRoom.gameState = { ...gameRoom.gameState, ...state };
          
          // Broadcast to other players
          socket.to(room).emit('game-state-update', gameRoom.gameState);
        }
        
        console.log(`Broadcasted game state update to room ${roomKey}`);
      }
    }
  });

  // Handle replay game requests
  socket.on('replay-game', ({ roomName, gameId }) => {
    const room = `${roomName}-${gameId}`;
    const roomKey = `${roomName}-${gameId}`;
    
    if (gameRooms.has(roomKey)) {
      const gameRoom = gameRooms.get(roomKey);
      
      // Reset game state to initial state
      gameRoom.gameState = getInitialGameState(gameId);
      gameRoom.messages = [];
      
      // Notify all players in the room that game has been reset
      io.to(room).emit('game-reset', {
        gameState: gameRoom.gameState
      });
      
      // Emit game-initialized to all players with their original symbol
      for (const player of gameRoom.players) {
        console.log(`[RESET] Emitting game-initialized to socketId=${player.socketId}, symbol=${player.symbol}`);
        io.to(player.socketId).emit('game-initialized', {
          symbol: player.symbol,
          gameStarted: true,
          currentPlayer: gameRoom.gameState.currentPlayer
        });
      }
      
      console.log(`Game reset in room ${roomKey}`);
    }
  });

  // Handle room state requests
  socket.on('get-room-state', ({ roomName, gameId }) => {
    const roomKey = `${roomName}-${gameId}`;
    
    if (gameRooms.has(roomKey)) {
      const gameRoom = gameRooms.get(roomKey);
      
      // Send current room state to the requesting client
      socket.emit('room-state', {
        players: gameRoom.players,
        playersCount: gameRoom.players.length,
        gameState: gameRoom.gameState
      });
      
      console.log(`Room state sent to ${socket.id} for room ${roomKey}`);
    }
  });

  // Special event for Guess Who guesses
  socket.on('guess-who-guess', ({ roomName, guess }) => {
    const room = `${roomName}-guesswho`;
    const roomKey = `${roomName}-guesswho`;
    
    if (gameRooms.has(roomKey)) {
      const gameRoom = gameRooms.get(roomKey);
      const player = gameRoom.players.find(p => p.socketId === socket.id);
      
      if (player && gameRoom.gameState.players) {
        const otherPlayerIndex = player.playerIndex === 0 ? 1 : 0;
        const targetCharacter = gameRoom.gameState.players[otherPlayerIndex];
        const isCorrect = guess === targetCharacter;
        
        const winner = isCorrect ? `Player ${player.playerIndex + 1}` : `Player ${otherPlayerIndex + 1}`;
        gameRoom.gameState.winner = winner;
        gameRoom.gameState.phase = 'finished';
        
        // Emit game-ended event
        io.to(room).emit('game-ended', { winner: winner });
        
        // Broadcast result to all players
        io.to(room).emit('game-state-update', {
          phase: 'finished',
          winner: winner,
          guess: guess,
          correctCharacter: targetCharacter
        });
      }
    }
  });

  socket.on('chat-message', (msg) => {
    // Only emit to all except sender (for echo, also emit to sender)
    socket.broadcast.emit('chat-message', msg);
    socket.emit('chat-message', msg);
  });

  // Direct Messaging Events
  socket.on('send-dm', async ({ senderId, receiverId, content, senderDisplayName, senderAvatar }) => {
    try {
      const newMessage = { sender_id: senderId, receiver_id: receiverId, content, timestamp: new Date().toISOString(), sender_display_name: senderDisplayName, sender_avatar: senderAvatar };

      // Find receiver's socket ID(s) from onlineUsers map
      const receiverSockets = Array.from(onlineUsers.entries())
        .filter(([sockId, userInfo]) => userInfo.uid === receiverId)
        .map(([sockId, userInfo]) => sockId);

      // Emit to receiver if online
      receiverSockets.forEach(sockId => {
        io.to(sockId).emit('receive-dm', newMessage);
      });

      // Also emit to sender for immediate display (self-echo)
      socket.emit('receive-dm', newMessage);

      console.log(`DM from ${senderId} to ${receiverId}: ${content}`);
    } catch (err) {
      console.error('Error sending DM:', err);
    }
  });

  // Game room chat event with persistence
  socket.on('game-chat-message', (msg) => {
    const roomKey = `${msg.roomName}-${msg.gameId}`;
    
    // Store message in game room
    if (gameRooms.has(roomKey)) {
      const gameRoom = gameRooms.get(roomKey);
      if (!gameRoom.messages) {
        gameRoom.messages = [];
      }
      gameRoom.messages.push(msg);
      
      // Keep only last 50 messages to prevent memory bloat
      if (gameRoom.messages.length > 50) {
        gameRoom.messages = gameRoom.messages.slice(-50);
      }
    }
    
    // Only emit to users in the same game room
    const room = `${msg.roomName}-${msg.gameId}`;
    socket.to(room).emit('game-chat-message', msg);
    // Optionally, also emit to sender for echo
    socket.emit('game-chat-message', msg);
  });

  // WebRTC signaling relay
  socket.on('webrtc-signal', ({ roomName, type, data }) => {
    // Relay to all other clients in the same room
    socket.to(roomName).emit('webrtc-signal', { roomName, type, data });
  });

  socket.on('disconnect', () => {
    onlineUsers.delete(socket.id);
    
    // Find and remove player from any game rooms they were in
    for (const [roomKey, gameRoom] of gameRooms.entries()) {
      const playerIndex = gameRoom.players.findIndex(p => p.socketId === socket.id);
      if (playerIndex !== -1) {
        const leavingPlayer = gameRoom.players[playerIndex];
        gameRoom.players.splice(playerIndex, 1);
        
        // Notify other players in the room
        const room = roomKey;
        socket.to(room).emit('player-left', {
          playersCount: gameRoom.players.length,
          player: leavingPlayer,
          players: gameRoom.players
        });
        
        console.log(`Player ${socket.id} disconnected and removed from room ${roomKey}`);
        break; // Player can only be in one game room at a time
      }
    }
    
    io.emit('presence-update', Array.from(onlineUsers.values()));
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});