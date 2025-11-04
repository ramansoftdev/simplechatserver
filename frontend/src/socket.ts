import { io } from 'socket.io-client';

// Connect to backend
export const socket = io('http://localhost:5000', {
  autoConnect: false // We'll connect manually after user enters name
});