import { io } from 'socket.io-client';

const SOCKET_URL = 'http://172.16.10.126:5000';
// const SOCKET_URL = 'https://hr.ggits.org/poling';
export const socket = io(SOCKET_URL, {
    withCredentials: true
});