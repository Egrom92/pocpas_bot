const showPassword = require("./showPassword");
const {default_kb} = require("@/keyboards");
module.exports = async (ctx, password) => {
  const {text, keyboard} = showPassword(password)
  ctx.scene.text = text
  ctx.scene.keyboard = keyboard
  await ctx.scene.leave();
  await ctx.reply('Что делаем дальше?', default_kb)
}