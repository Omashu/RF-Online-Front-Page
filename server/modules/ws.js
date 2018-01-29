import config from 'config'
import WebSocket from 'ws'
import Router from 'koa-router'
import serverState from '../reps/serverState'
import { createLogger } from '../utils/logger'
import { SocketEmitter, ServerStateEmitter } from '../events'
import { io } from '../app'

let client;
const logger = createLogger("Module `ws`")

const createConnect = () => {
  logger.info(`Trying to connect to`, config.get("modules.ws.connectTo"))

  client = new WebSocket(config.get("modules.ws.connectTo"))

  client.on("open", () => logger.info(`Successfully connected to server`));

  client.on("close", () => {
    logger.info(`Connection lost, try reconnect after 5 seconds`)
    setTimeout(createConnect, 5000)
  })

  client.on("message", (message) => {
    const data = JSON.parse(message.toString())
    SocketEmitter.emit(data[0], data[1])
  })

  client.on("error", (err) => logger.error(err))
}

const broadcast = (event, data) => {
  io.emit(event, data)
}

export const initialize = () => {
  createConnect()

  io.on('connect', (socket) => {
    socket.emit("serverState", serverState.current())
  })

  logger.info(`Initialized`)
}

export default {
  initialize
}

SocketEmitter.on("serverState.updated", (data) => serverState.update(data))
ServerStateEmitter.on("updated", (data) => broadcast("serverState", data))