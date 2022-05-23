const {Markup} = require("telegraf");
module.exports = async (password) => {
  return {
    text: `<code>${password}</code>`,
    keyboard: Markup.inlineKeyboard([Markup.button.callback('Скопировал', JSON.stringify({type: 'CLEAR_PASSWORD'}))])
  }
}