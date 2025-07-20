
// Socket.IO client setup with room persistence
import { io, Socket } from 'socket.io-client';

const URL = 'https://mind-vault-kcfw.onrender.com'; // Updated to production backend
export const socket: Socket = io(URL, {
  autoConnect: true,
});

export function announceOnline(user: any) {
  socket.emit('user-online', user);
}

// General room persistence helpers
export function saveRoomState(roomType: 'game' | 'chat', roomData: any) {
  const roomState = {
    roomType,
    ...roomData,
    timestamp: Date.now()
  };
  localStorage.setItem('mindVaultRoomState', JSON.stringify(roomState));
}

export function getStoredRoomState() {
  try {
    const stored = localStorage.getItem('mindVaultRoomState');
    if (stored) {
      const state = JSON.parse(stored);
      // Check if stored state is not too old (e.g., within 24 hours)
      if (Date.now() - state.timestamp < 24 * 60 * 60 * 1000) {
        return state;
      }
    }
  } catch (error) {
    console.error('Error retrieving stored room state:', error);
  }
  return null;
}

export function clearRoomState() {
  localStorage.removeItem('mindVaultRoomState');
}

// Game room specific functions
export function saveGameRoomState(roomName: string, gameId: string, user: any) {
  saveRoomState('game', { roomName, gameId, user });
}

export function rejoinGameRoom(roomName: string, gameId: string, user: any) {
  console.log('Rejoining game room:', roomName, gameId);
  socket.emit('rejoin-game-room', { roomName, gameId, user });
}

// Global chat room functions
export function saveGlobalChatState(user: any) {
  saveRoomState('chat', { user });
}

export function rejoinGlobalChat(user: any) {
  console.log('Rejoining global chat');
  socket.emit('rejoin-global-chat', { user });
}

// Legacy functions for backward compatibility
export function getStoredGameRoomState() {
  const state = getStoredRoomState();
  return state && state.roomType === 'game' ? state : null;
}

export function clearGameRoomState() {
  clearRoomState();
}
