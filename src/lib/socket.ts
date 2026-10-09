import { io, Socket } from 'socket.io-client';
import { getAuthToken } from './token';

let socket: Socket | null = null;

const BACKEND_URL = (import.meta as any).env?.VITE_API_URL
  ? (import.meta as any).env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:3000';

export function connectSocket(_role?: string): Socket {
  if (socket?.connected) return socket;

  const token = getAuthToken();

  socket = io(BACKEND_URL, {
    transports: ['websocket', 'polling'],
    reconnectionDelay: 5000,
    reconnectionAttempts: 5,
    // Token via handshake auth (not URL query) so it isn't logged in URLs/proxies.
    // Role is derived server-side from the verified JWT; no role is sent.
    auth: {
      token: token || ''
    }
  });

  socket.on('connect', () => {
  });

  socket.on('disconnect', () => {
  });

  socket.on('connect_error', () => {
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}
