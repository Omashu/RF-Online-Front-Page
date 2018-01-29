const TextOnline = "Онлайн"
const TextOffline = "Оффлайн"
const TextPending = "Подключение..."
const ClassOnline = "online"
const ClassOffline = "offline"
const ClassPending = "pending"

const LoginStatusClassName = "js-login__status"
const ServerStatusClassName = "js-server__status"
const A_CountClassName = "js-count__a"
const B_CountClassName = "js-count__b"
const C_CountClassName = "js-count__c"
const Total_CountClassName = "js-count__total"

const addClassName = (elements, name) => {
  _.forEach(elements, (el) => {
    el.classList.add(name)
  })
}

const removeClassName = (elements, name) => {
  _.forEach(elements, (el) => {
    el.classList.remove(name)
  })
}

const textContent = (elements, text) => {
  _.forEach(elements, (el) => {
    el.textContent = text
  })
}

const toggler = (elements, state, nameOnline, nameOffline, textOnline, textOffline) => {
  if (state) {
    addClassName(elements, nameOnline)
    removeClassName(elements, nameOffline)
    textContent(elements, textOnline)
  }
  else {
    addClassName(elements, nameOffline)
    removeClassName(elements, nameOnline)
    textContent(elements, textOffline)
  }
}

export default (data) => {
  const loginStatusElements = document.getElementsByClassName(LoginStatusClassName)
  const serverStatusElements = document.getElementsByClassName(ServerStatusClassName)

  const totalPlayersElements = document.getElementsByClassName(Total_CountClassName)
  const aPlayersElements = document.getElementsByClassName(A_CountClassName)
  const bPlayersElements = document.getElementsByClassName(B_CountClassName)
  const cPlayersElements = document.getElementsByClassName(C_CountClassName)

  if (data.loginPending !== undefined) {
    if (data.loginPending) {
      addClassName(loginStatusElements, ClassPending)
      textContent(loginStatusElements, TextPending)
    }
    else {
      removeClassName(loginStatusElements, ClassPending)
    }
  }

  if (data.loginStatus !== undefined) {
    toggler(loginStatusElements, data.loginStatus, ClassOnline, ClassOffline, TextOnline, TextOffline)
  }

  if (data.serverPending !== undefined) {
    if (data.serverPending) {
      addClassName(serverStatusElements, ClassPending)
      textContent(serverStatusElements, TextPending)
    }
    else {
      removeClassName(serverStatusElements, ClassPending)
    }
  }

  if (data.serverStatus !== undefined) {
    toggler(serverStatusElements, data.serverStatus, ClassOnline, ClassOffline, TextOnline, TextOffline)
  }

  if (data.players !== undefined) {
    if (data.players.total !== undefined)
      textContent(totalPlayersElements, data.players.total)

    if (data.players.a !== undefined)
      textContent(aPlayersElements, data.players.a)

    if (data.players.b !== undefined)
      textContent(bPlayersElements, data.players.b)

    if (data.players.c !== undefined)
      textContent(cPlayersElements, data.players.c)
  }
}