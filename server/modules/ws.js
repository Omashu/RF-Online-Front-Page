import WebSocket from 'ws';
import { merge } from 'lodash';

const initialData = {
  connection: false,
  connected: false,

  loginPending: false,
  loginStatus: false,
  loginErrorCode: null,

  serverPending: false,
  serverStatus: false,
  serverErrorCode: null,

  players: {
    a: 0,
    b: 0,
    c: 0,
    total: 0,
    map: {}
  }
};

export default module.exports = function Init({ logger, options, socket }) {
  this.connectTo = options.connectTo;
  this.client = undefined;

  this.storageData = merge({}, initialData);

  this.dispatchToView = () => this.storageData;

  this.resetAndBroadcastStorage = () => {
    this.storageData = merge({}, initialData);
    this.broadcast(this.storageData);
    return this;
  };

  this.updateAndBroadcastStorage = (data) => {
    this.storageData = merge(this.storageData, data);
    this.broadcast(this.storageData);
    return this;
  };

  this.broadcast = (data) => socket.emit('updated', data);

  this.createConnect = () => {
    this.resetAndBroadcastStorage();
    logger.info('Create connection to %s', this.connectTo);
    this.client = new WebSocket(this.connectTo);

    this.client.on('open', () => logger.info('Successfully connected to server'));

    this.client.on('close', () => {
      logger.info('Connection lost, try reconnect after 15 seconds');
      setTimeout(this.createConnect.bind(this), 15000);
    });

    this.client.on('message', (message) => {
      const data = JSON.parse(message.toString());
      this.updateAndBroadcastStorage(data);
    });

    this.client.on('error', (err) => logger.error('Connection failed %s', err.message).error(err.stack));
  };

  this.createConnect();

  socket.instance.on('connect', (socketClient) => {
    const op = socket.wrapClient(socketClient);
    // by the first connect
    op.emit('updated', this.storageData);
  });

  return this;
};
