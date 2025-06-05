// Socket.IO client setup
import { io, Socket } from 'socket.io-client';

const URL = 'http://localhost:4000'; // Update if deploying
export const socket: Socket = io(URL, {
  autoConnect: true,
});

export function announceOnline(user: any) {
  socket.emit('user-online', user);
}
