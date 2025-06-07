// Express + Socket.IO + Neon (Postgres) backend scaffold
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Neon Postgres connection (replace with your Neon connection string)
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_g1IsJlVdE6pt@ep-cold-lab-a8t05z3v-pooler.eastus2.azure.neon.tech/puzzle?sslmode=require',
});

app.use(cors());
app.use(express.json());

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

// Register a new user
app.post('/api/register', async (req, res) => {
  const { uid, username, displayName, avatar, rank, coins, experience, puzzlesSolved, achievements } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO users (uid, username, display_name, avatar, rank, coins, experience, puzzles_solved, achievements)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [uid, username, displayName, avatar, rank || 'Novice', coins || 100, experience || 0, puzzlesSolved || 0, achievements || []]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
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

// Leaderboard endpoint
app.get('/api/leaderboard', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY experience DESC, coins DESC LIMIT 100');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// In-memory presence tracking
const onlineUsers = new Map(); // socket.id -> userInfo

// Example Socket.IO events
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Listen for user info (sent from client after connect)
  socket.on('user-online', (userInfo) => {
    onlineUsers.set(socket.id, userInfo);
    io.emit('presence-update', Array.from(onlineUsers.values()));
  });

  // Join a game room
  socket.on('join-game-room', ({ roomName, gameId }) => {
    const room = `${roomName}-${gameId}`;
    socket.join(room);
    // Optionally: emit current state to this user
  });

  // Game state update event
  socket.on('game-state-update', ({ roomName, gameId, state }) => {
    const room = `${roomName}-${gameId}`;
    socket.to(room).emit('game-state-update', state);
  });

  socket.on('chat-message', (msg) => {
    io.emit('chat-message', msg);
  });

  // Game room chat event
  socket.on('game-chat-message', (msg) => {
    io.emit('game-chat-message', msg);
  });

  // WebRTC signaling relay
  socket.on('webrtc-signal', ({ roomName, type, data }) => {
    // Relay to all other clients in the same room
    socket.to(roomName).emit('webrtc-signal', { roomName, type, data });
  });

  socket.on('disconnect', () => {
    onlineUsers.delete(socket.id);
    io.emit('presence-update', Array.from(onlineUsers.values()));
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
