const {Scenes} = require('telegraf')
const text = require('../text.json')
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
        await axios.get(getApiUrl(['subscriber', userID, 'master-password', ctx.message.text]))
          .then(async res => {
            if (res.data) {
              ctx.session.authorized = true;
              await ctx.reply('Вы ввели верный пароль \n\n' + text.instruction)

              await ctx.scene.leave();
            } else {
              await ctx.reply('Пароль не верный. Повторите попытку')
              await ctx.scene.reenter()
            }
          })
          .catch(async err => {
            await console.log(err)
            await ctx.reply('Пароль не верный. Повторите попытку')
          })
      } else {
        ctx.reply('Пароль не может содержать кирилицу')
        await ctx.scene.reenter()
      }


    })

    return enterMasterPassword
  }

  createMasterPassword() {
    const createMasterPassword = new Scenes.BaseScene('createMasterPassword')
    createMasterPassword.enter(ctx => ctx.reply('У тебя нету акаунта.  Придумай и напиши мастер пароль'))

    createMasterPassword.on('text', async ctx => {
      const pass = ctx.message.text;

      if (pass) {
        if (!isKyr(pass)) {
          const {id, first_name, last_name, username, language_code} = ctx.message.from
          const query = {
            tg_id: id, first_name, last_name, username, language_code, master_password: pass
          }
          axios.post(getApiUrl('subscriber'), query)
            .then(async res => {
              if (res.data) {
                await ctx.reply('Акаунт создан \n\n' +
                  'Создать новый пароль -> \n/add {название сайта} \n\n' +
                  'Запросить пароль -> \n/get {название сайта} \n\n' +
                  'Запроси список сайтов - \n/all \n\n' +
                  'Удалить сайт -> \n/del {название сайта} \n\n' +
                  'Редактировать сайт -> \n/edit {название старого сайта} {название нового сайта} \n\n' +
                  'Редактировать пароль -> \n/edit {название сайта сайта}')
                await ctx.scene.leave()
              }
            })
            .catch(err => console.log(err))
        } else {
          await ctx.reply('Пароль не может содержать кирилицу')
          await ctx.scene.reenter()
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
        axios.post(getApiUrl(['subscriber', userID, 'password']), {site})
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

  getPassword() {
    const getPassword = new Scenes.BaseScene('getPassword')

    getPassword.enter(async ctx => {
      const userID = ctx.message.from.id
      const site = ctx.message.text.replace('/get', '').trim()
      const text = {
        multiSite: 'У тебя сайтов пока нету \n\n' +
          'Создать новый пароль - /add {название сайта}',
        oneSite: 'Такого сайта нету.'
      }

      await axios.get(getApiUrl(['subscriber', userID, 'password'], {site}))
        .then(async res => {
          if (!res.data.length) {
            await ctx.reply(site === '*' ? text.multiSite : text.oneSite)
          } else {
            let allPasswords = '';
            await res.data.map(el => {
              allPasswords += `${el.site_name}  _________  <code>${el.password}</code>\n\n`
            })
            await ctx.reply(allPasswords, {parse_mode: 'HTML'})
          }
        })
        .catch(err => console.log(err))
      await ctx.scene.leave()
    })

    return getPassword;
  }

  deletePassword() {
    const deletePassword = new Scenes.BaseScene('deletePassword')

    deletePassword.enter(async ctx => {
      const userID = ctx.message.from.id
      const site = ctx.message.text.replace('/del', '').trim()

      await axios.delete(getApiUrl(['subscriber', userID, 'password'], {site}))
        .then(async res => {
          if (res.data) {
            await ctx.reply(`Ваш сайт ${site} удалён`)
          } else {
            await ctx.reply('Такого сайта нету')
          }
        })
        .catch(err => console.log(err))
      ctx.scene.leave();
    })
    return deletePassword;
  }

  editPasswordOrSite() {
    const editPasswordOrSite = new Scenes.BaseScene('editPasswordOrSite')

    editPasswordOrSite.enter(async ctx => {
      const userID = ctx.message.from.id
      const site = ctx.message.text.replace('/edit', '').trim().split(' ')

      const EDIT_PASSWORD = 1;
      const EDIT_SITE = 2;

      if (site.length === EDIT_PASSWORD) {
        await axios.patch(getApiUrl(['subscriber', userID, 'password'], {site}))
          .then(async res => {
            if (res.data) {
              let password = `${site}  _________  <code>${res.data}</code>`;
              await ctx.reply(password, {parse_mode: 'HTML'})
            } else {
              await ctx.reply('Такого сайта нету, повти попытку')
            }
          })
          .catch(err => console.log(err))
      } else if (site.length === EDIT_SITE) {
        await axios.patch(getApiUrl(['subscriber', userID, 'password'], {'site': site[0], 'new': site[1]}))
          .then(async res => {
            if (res.data) {
              let password = `${site[0]} поменял на <code>${site[1]}</code>`;
              await ctx.reply(password, {parse_mode: 'HTML'})
            } else {
              await ctx.reply('Такого сайта нету, повти попытку')
            }
          })
          .catch(err => console.log(err))
      } else {
        await ctx.reply('Ты ввёл не верную запись \n\n' +
          'Редактировать сайт -> \n/edit {название старого сайта} {название нового сайта} \n\n' +
          'Редактировать пароль -> \n/edit {название сайта сайта}')
      }
      ctx.scene.leave();

    })
    return editPasswordOrSite;
  }
}
