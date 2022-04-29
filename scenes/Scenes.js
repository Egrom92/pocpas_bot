const {Scenes} = require('telegraf')

const axios = require('axios');
const getApiUrl = require("../helpers/getApiUrl");


class SceneGenerator {
  GenCheckMasterPasswordScene() {
    const checkMasterPassword = new Scenes.BaseScene('checkMasterPassword')

    checkMasterPassword.enter(async (ctx) => {
      const userID = ctx.message.from.id

      getApiUrl(['subscriber', 'test'])

      await axios.get(getApiUrl(['subscriber', userID]))
        .then( async res => {
          if (res.data) {
            ctx.scene.enter('enterMasterPassword')
            await ctx.scene.leave()
          } else {
            ctx.scene.enter('createMasterPassword')
          }
        })
        .catch(function (err) {
          console.log(err);
        })
    })

    return checkMasterPassword
  }

  GenEnterMasterPassword() {
    const enterMasterPassword = new Scenes.BaseScene('enterMasterPassword')

    enterMasterPassword.enter(async ctx => ctx.reply('Введите мастер пароль'))

    enterMasterPassword.on('text', async ctx => {
      const userID = ctx.message.from.id
      ctx.reply('Вы сделали запрос на  ' + getApiUrl(['subscriber', userID, ctx.message.text]))
      await axios.get(getApiUrl(['subscriber', userID, ctx.message.text]))
    })

    return enterMasterPassword
  }

  GenCreateMasterPassword () {
    const createMasterPassword = new Scenes.BaseScene('createMasterPassword')
    createMasterPassword.enter(ctx => ctx.reply('У вас нету акаунта.  Введите пожалуйста мастер пароль'))

    createMasterPassword.on('text', async ctx => {
      const pass = ctx.message.text;


      if (pass) {
        const {id, first_name, last_name, username, language_code} = ctx.message.from
        const query = {
          tg_id: id, first_name, last_name, username, language_code, master_password: pass
        }
        console.log('Create pass link ---- ', getApiUrl('subscriber', query));
        await axios.post(getApiUrl('subscriber'), query)
          .then( async res => {
            if (res.data) {
              console.log(res.data);
              await ctx.reply('Акаунт создан')
              await ctx.scene.leave()
            }
          })
          .catch(function (err) {
            console.log(err);
          })
      }
    })
    return createMasterPassword
  }

  GenCreatePassword() {

  }

}

module.exports = SceneGenerator