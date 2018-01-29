let news = []

export const reset = () => {
  news = []
}

export const getAll = () => {
  return [...news]
}

export const append = (el) => {
  news.push(el)
}

export default {
  reset,
  getAll,
  append
}