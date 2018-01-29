import _ from 'lodash'
import { ServerStateEmitter } from '../events'

let serverState = {
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
    map : {}
  }
}

export const update = (values) => {
  serverState = {...serverState, ...values}
  ServerStateEmitter.emit("updated", {...values})
}

export const current = () => {
  return {...serverState}
}

export default {
  update,
  current
}