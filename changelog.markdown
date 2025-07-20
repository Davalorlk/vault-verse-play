# Changelog

This file records all significant changes made to the project. Each entry should include the date, a summary of the change, and the files affected.

---

## [2025-06-05] Changelog initialized
- Created `changelog.markdown` to track all future changes and facilitate easy reverts.

## [2025-06-05] Multiplayer game room support for board games
- Started implementing real-time multiplayer support for all board games.
- Players can now join the same game by importing/entering the same game room name.
- Updated: `src/components/games/GameRoom.tsx`, `src/components/games/BoardGames.tsx`

## [2025-06-05] Integrated Firebase for real-time multiplayer
- Installed Firebase SDK and created `src/lib/firebase.ts` for configuration.
- Updated `GameRoom` to sync chat and game state in real time using Firebase Realtime Database.
- Players joining the same room name now see synchronized chat and opponent info.
- Updated: `package.json`, `src/lib/firebase.ts`, `src/components/games/GameRoom.tsx`

## [2025-06-05] Extended real-time backend to all board games
- Updated the real-time backend logic to support all board games in the platform.
- Each board game now synchronizes its state and chat in real time using Firebase, keyed by room name and game type.
- All board games are now ready for real-time two-player play.
- Updated: `src/components/games/GameRoom.tsx`, `src/components/games/BoardGames.tsx`, `src/lib/firebase.ts`

## [2025-06-05] Implemented game logic for all board games
- Added real-time, two-player logic for Chess, Tic Tac Toe, Connect Four, Checkers, Ludo, Dot and Box, Gomoku, Hangman, Nine Holes, and Guess Who.
- Each game now has its own component in `src/components/games/` with Firebase state sync.
- Updated: `src/components/games/ChessBoard.tsx`, `src/components/games/TicTacToe.tsx`, `src/components/games/ConnectFour.tsx`, `src/components/games/Checkers.tsx`, `src/components/games/Ludo.tsx`, `src/components/games/DotAndBox.tsx`, `src/components/games/Gomoku.tsx`, `src/components/games/Hangman.tsx`, `src/components/games/NineHoles.tsx`, `src/components/games/GuessWho.tsx`

## [2025-06-05] Connected all board game components to GameRoom UI
- GameRoom now dynamically renders the correct board game component based on the selected game.
- All board games are playable in real time within the GameRoom interface.
- Updated: `src/components/games/GameRoom.tsx`

## [2025-06-05] Added real-time voice chat/call with WebRTC
- Integrated WebRTC-based real-time voice chat/call in GameRoom using Firebase for signaling.
- Players can start/end calls and communicate with audio while playing.
- Modernized chat UI for a smooth, collaborative experience.
- Updated: `src/components/games/GameRoom.tsx`, `src/lib/webrtcSignaling.ts`

## [2025-06-05] Full game logic and smart AI for Checkers, Connect Four, Chess, Dots and Boxes, and Nine Holes
- Implemented full playable logic for Checkers: valid moves, captures, kinging, win detection, and UI feedback.
- Upgraded Connect Four AI to block, win, and play strategically.
- Implemented full Chess move validation, check/checkmate/stalemate detection, and smarter AI.
- Completed Dots and Boxes: box claiming, scoring, colored lines, extra turn, and winner detection.
- Completed Nine Holes: placement and movement phases, win detection, token selection, and modern UI feedback.
- Updated: `src/components/games/Checkers.tsx`, `src/components/games/ConnectFour.tsx`, `src/components/games/ChessBoard.tsx`, `src/components/games/DotAndBox.tsx`, `src/components/games/NineHoles.tsx`

---
