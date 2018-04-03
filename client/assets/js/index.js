import io from 'socket.io-client';
import online from './online';

const key = '__CONFIG__';
export const config = window[key];

// connect to socket
export const socket = io(config.url, {
  transports: ['websocket'],
  perMessageDeflate: false
});

socket.on('ws.updated', online);

export default {
  socket
};
