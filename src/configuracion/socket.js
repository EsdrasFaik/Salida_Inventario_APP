import { io } from "socket.io-client";

export const Servidor = process.env.REACT_APP_API_URL;
//export const Servidor = 'http://localhost:3001';

export const socket = io(Servidor, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
});