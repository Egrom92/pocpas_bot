const {default_kb} = require("@/keyboards");
module.exports = function (scene, {keyboard = default_kb, text = "Что делаем дальше?"} = {}) {
  scene.hears('Отмена', ctx => {
    ctx.deleteMessage()
    ctx.scene.text = text
    ctx.scene.keyboard = keyboard
    ctx.scene.leave()
  })
}