import { io } from 'socket.io-client';

const SOCKET_URL = 'https://menti-clone-backend-2.onrender.com';
// const SOCKET_URL = 'https://hr.ggits.org/poling';
export const socket = io(SOCKET_URL, {
    withCredentials: true
});