const {Scenes} = require('telegraf')

const axios = require('axios');
const getApiUrl = require("../helpers/getApiUrl");
const isKyr = require("../helpers/isKyr");


module.exports = class SceneGenerator {
  checkMasterPasswordScene() {
    const checkMasterPassword = new Scenes.BaseScene('checkMasterPassword')

    checkMasterPassword.enter(async (ctx) => {
      const userID = ctx.message.from.id

      await axios.get(getApiUrl(['subscriber', userID]))
        .then(async res => {
          if (res.data) {
            ctx.scene.enter('enterMasterPassword')
            await ctx.scene.leave()
          } else {
            ctx.scene.enter('createMasterPassword')
          }
        })
        .catch(err => console.log(err))
    })

    return checkMasterPassword
  }

  enterMasterPassword() {
    const enterMasterPassword = new Scenes.BaseScene('enterMasterPassword')

    enterMasterPassword.enter(async ctx => ctx.reply('Введите  мастер пароль'))

    enterMasterPassword.on('text', async ctx => {
      const userID = ctx.message.from.id
      const pass = ctx.message.text

      if (!isKyr(pass)) {
        await axios.get(getApiUrl(['subscriber', userID, ctx.message.text]))
          .then(async res => {
            if (res.data) {
              ctx.reply('Вы ввели верный пароль \n\n' +
                'Создать новый пароль - /add {название сайта} \n\n' +
                'Запросить пароль - /get {название сайта} \n\n' +
                'Запроси список сайтов - /all \n\n' +
                'Удалить сайт - /del {название сайта} \n\n' +
                'Редактировать - /edit {название сайта}')

              ctx.scene.leave();
            } else {
              await ctx.reply('У вас не правельный пароль. Повторите попытку')
              await ctx.scene.reenter()
            }
          })
          .catch(err => console.log(err))
      } else {
        ctx.reply('Пароль не может содержать кирилицу')
        ctx.scene.reenter()
      }


    })

    return enterMasterPassword
  }

  createMasterPassword() {
    const createMasterPassword = new Scenes.BaseScene('createMasterPassword')
    createMasterPassword.enter(ctx => ctx.reply('У вас нету акаунта.  Введите пожалуйста мастер пароль'))

    createMasterPassword.on('text', async ctx => {
      const pass = ctx.message.text;

      if (pass) {
        if (!isKyr(pass)) {
          const {id, first_name, last_name, username, language_code} = ctx.message.from
          const query = {
            tg_id: id, first_name, last_name, username, language_code, master_password: pass
          }
          console.log('Create pass link ---- ', getApiUrl('subscriber', query));
          await axios.post(getApiUrl('subscriber'), query)
            .then(async res => {
              if (res.data) {
                console.log(res.data);
                await ctx.reply('Акаунт создан \n\n' +
                  'Создать новый пароль - /add {название сайта} \n\n' +
                  'Запросить пароль - /get {название сайта} \n\n' +
                  'Запроси список сайтов - /all \n\n' +
                  'Удалить сайт - /del {название сайта} \n\n' +
                  'Редактировать - /edit {название сайта}')
                ctx.scene.leave()
              }
            })
            .catch(err => console.log(err))
        } else {
          ctx.reply('Пароль не может содержать кирилицу')
          ctx.scene.reenter()
        }
      }
    })
    return createMasterPassword
  }

  createPassword() {
    const createPassword = new Scenes.BaseScene('createPassword')
    createPassword.enter(async ctx => {
      const userID = ctx.message.from.id
      const site = ctx.message.text.replace('/add', '').trim()

      if (!site.length) {
        await ctx.reply('Вы забыли написать название сайта \n \n' +
          'Создать новый пароль - /add {название сайта}')
      } else {
        axios.post(getApiUrl(['subscriber', userID, 'add']), {site})
          .then(res => {
            if (res.data.status) {
              ctx.reply(`Твой сайт ${site} и пароль <code>${res.data.pass}</code>`, {parse_mode: 'HTML'})
            } else
              ctx.reply(`${site} уже был есть и пароль <code>${res.data.pass}</code>`, {parse_mode: 'HTML'})
          })
          .catch(err => console.log(err))
      }
      ctx.scene.leave()

    })

    return createPassword
  }

}
