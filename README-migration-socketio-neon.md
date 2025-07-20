# Migration Plan: Firebase → Socket.IO + Neon (Postgres)

## 1. Remove Firebase
- Delete `src/lib/firebase.ts`
- Remove all Firebase imports/usages from React components
- Delete `firebase.rules.json`
- Remove `firebase` and related packages from `package.json`

## 2. Add Socket.IO Backend
- Create a new `server/` folder with an Express + Socket.IO server
- Add Neon (Postgres) connection for persistent storage
- Implement endpoints for user registration, login, stats, and game state
- Implement Socket.IO events for real-time chat, presence, and game state

## 3. Update Frontend
- Use `socket.io-client` for real-time features
- Use REST or direct SQL for persistent data (user stats, etc.)
- Refactor all components to use Socket.IO instead of Firebase

---

## Next Steps
- Remove all Firebase code and config (in progress)
- Scaffold backend and frontend Socket.IO integration
