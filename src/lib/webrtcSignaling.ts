// Simple WebRTC signaling using Firebase Realtime Database
// This is a utility for exchanging WebRTC offer/answer/candidates via Firebase
import { db } from '@/lib/firebase';
import { ref, push, onChildAdded, remove } from 'firebase/database';

export function sendSignal(roomName: string, type: string, data: any) {
  const signalRef = ref(db, `rooms/${roomName}/signals`);
  push(signalRef, { type, data });
}

export function listenSignals(roomName: string, callback: (type: string, data: any) => void) {
  const signalRef = ref(db, `rooms/${roomName}/signals`);
  onChildAdded(signalRef, (snapshot) => {
    const val = snapshot.val();
    callback(val.type, val.data);
    // Remove the signal after processing
    remove(snapshot.ref);
  });
}
