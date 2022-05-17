const {default_kb} = require("../keyboards");
module.exports = function (scene) {
  scene.hears('Отмена', ctx => {
    ctx.scene.text = 'Что делаем дальше?'
    ctx.scene.kb = default_kb
    ctx.scene.leave()
  })
}