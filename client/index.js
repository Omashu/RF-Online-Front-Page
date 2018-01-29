import 'bootstrap/dist/css/bootstrap.css'
import './scss/index.scss'

import _ from 'lodash'
import io from 'socket.io-client';
import online from './online'

// connect to socket
const socket = io(window.__CONFIG__.url, {
  transports: ["websocket"],
  perMessageDeflate: false
});

socket.on("serverState", online)