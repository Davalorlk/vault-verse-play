// Socket.IO client setup
import { io, Socket } from 'socket.io-client';

const URL = 'https://mind-vault-kcfw.onrender.com'; // Updated to production backend
export const socket: Socket = io(URL, {
  autoConnect: true,
});

export function announceOnline(user: any) {
  socket.emit('user-online', user);
}
