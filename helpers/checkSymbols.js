const {exit_kb} = require("../keyboards");
module.exports = async function (ctx) {
  const symbols = ['/', '@', '#'];
  const symbol = symbols.find(symbol => ctx.message.text[0] === symbol)

  if (symbol) {
    ctx.scene.text = `Ключевое слово не может начинаться на "${symbol}"`
    ctx.scene.kb = exit_kb
    await ctx.scene.reenter()
    return symbol
  }
}