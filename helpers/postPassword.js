const axios = require("axios");
const {exit_kb, default_kb} = require(`@/keyboards`)
const setPasswordKeyboard = require("./setPasswordKeyboard");
const saveDataToSession = require("./saveDataToSession");


module.exports = async (ctx, url, params) => {
  await axios.post(url, params)
    .then(async res => {
      if (res.data.session) {
        await setPasswordKeyboard(ctx, res.data.response_data.password)
        await ctx.replyWithHTML(ctx.scene.text, ctx.scene.keyboard)
      } else {
        await saveDataToSession(ctx, {url, params, sceneName: 'createPassword'})
        ctx.scene.text = 'Ваша сессия закончилась, сседите пожалуйста мастер пароль'
        ctx.scene.keyboard = exit_kb
        await ctx.scene.enter('enterMasterPassword')
      }
    })
    .catch(err => console.log(err))
}