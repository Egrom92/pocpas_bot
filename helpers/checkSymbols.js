module.exports = function (pass) {
  const symbols = ['/', '@', '#'];
  return symbols.find(symbol => pass[0] === symbol)
}