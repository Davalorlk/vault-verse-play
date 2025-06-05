// Firebase configuration and initialization
// Replace the config object with your Firebase project credentials
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyDP2SDZlXgkwWAPB8mm7w1O-iQQU7_qox0',
  authDomain: 'mindvault-1e47f.firebaseapp.com',
  databaseURL: 'https://mindvault-1e47f.firebaseio.com',
  projectId: 'mindvault-1e47f',
  storageBucket: 'mindvault-1e47f.appspot.com',
  messagingSenderId: '1044628836327',
  appId: '1:1044628836327:web:8757866963f9dfa141b742',
  measurementId: 'G-9Q0ND6BNP5',
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
