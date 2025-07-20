import { socket } from './socket';

// WebRTC signaling using Socket.IO

export function sendSignal(roomName: string, type: string, data: any) {
  socket.emit('webrtc-signal', { roomName, type, data });
}

export function listenSignals(roomName: string, callback: (type: string, data: any) => void) {
  const handler = (payload: { roomName: string; type: string; data: any }) => {
    if (payload.roomName === roomName) {
      callback(payload.type, payload.data);
    }
  };
  socket.on('webrtc-signal', handler);
  return () => socket.off('webrtc-signal', handler);
}
