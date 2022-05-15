const {Scenes} = require('telegraf')
const text = require('../text.json')
const axios = require('axios');
const getApiUrl = require("../helpers/getApiUrl");
const isKyr = require("../helpers/isKyr");
const replyAndDestroy = require('../helpers/replyAndDestroy')
const {exit_kb, default_kb} = require('../keyboards')


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

    enterMasterPassword.enter(async ctx => ctx.reply(text.enter_master_password))

    enterMasterPassword.on('text', async ctx => {
      const userID = ctx.message.from.id
      const pass = ctx.message.text

      if (!isKyr(pass)) {
        await axios.get(getApiUrl(['subscriber', userID, 'master-password', ctx.message.text]))
          .then(async res => {
            if (res.data) {
              await ctx.deleteMessage()
              ctx.session.authorized = true;
              await ctx.reply('Вы ввели верный пароль', default_kb)

              await ctx.scene.leave();
            } else {
              await ctx.reply(text.incorrect_password)
              await ctx.scene.reenter()
            }
          })
          .catch(async err => {
            await console.log(err)
            await ctx.reply(text.incorrect_password)
          })
      } else {
        ctx.reply(text.no_cyrillic)
        await ctx.scene.reenter()
      }


    })

    return enterMasterPassword
  }

  createMasterPassword() {
    const createMasterPassword = new Scenes.BaseScene('createMasterPassword')
    createMasterPassword.enter(ctx => ctx.reply(text.create_master_password))

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
                await ctx.reply('Акаунт создан \n\n' + text.instruction.all)
                await ctx.scene.leave()
              }
            })
            .catch(err => console.log(err))
        } else {
          await ctx.reply(text.no_cyrillic)
          await ctx.scene.reenter()
        }
      }
    })
    return createMasterPassword
  }

  createPassword() {
    const createPassword = new Scenes.BaseScene('createPassword')
    createPassword.enter(ctx => ctx.reply('Введите название сайта', exit_kb))
    createPassword.hears('Отмена', ctx => {
      ctx.scene.text = 'Что делаем дальше?'
      ctx.scene.leave()
    })
    createPassword.on('text', async ctx => {
      const userID = ctx.message.from.id
      const site = ctx.message.text

      await axios.post(getApiUrl(['subscriber', userID, 'password']), {site})
        .then(res => {
          if (res.data.status) {
            ctx.scene.text = `Твой сайт ${site} и пароль <code>${res.data.pass}</code>`;
          } else
            ctx.scene.text = `${site} уже был, пароль <code>${res.data.pass}</code>`;
        })
        .catch(err => console.log(err))

      await ctx.scene.leave();
    })
    createPassword.leave(ctx => ctx.replyWithHTML(ctx.scene.text, default_kb))

    return createPassword
  }

  getPassword() {
    const getPassword = new Scenes.BaseScene('getPassword')

    getPassword.hears('Отмена', ctx => {
      ctx.scene.text = 'Что делаем дальше?'
      ctx.scene.leave()
    })

    getPassword.on('text', async ctx => {
      const userID = ctx.message.from.id
      const site = ctx.message.text

      await axios.get(getApiUrl(['subscriber', userID, 'password'], {site}))
        .then(async res => {
          if (!res.data) {
            ctx.scene.text = text.wrong_site
            ctx.scene.kb = exit_kb
            await ctx.scene.reenter();
          } else {
            ctx.scene.text = `${res.data.site_name}  _________  <code>${res.data.password}</code>`
            ctx.scene.kb = default_kb
            await ctx.scene.leave();
          }
        })
        .catch(err => console.log(err))
    })
    getPassword.leave(ctx => ctx.replyWithHTML(ctx.scene.text, ctx.scene.kb))

    return getPassword;
  }

  getAllPasswords() {
    const getAllPasswords = new Scenes.BaseScene('getAllPasswords');

    getAllPasswords.hears('Отмена', ctx => {
      ctx.scene.text = 'Что делаем дальше?'
      ctx.scene.leave()
    })

    getAllPasswords.enter(async ctx => {
      const userID = ctx.message.from.id
      await axios.get(getApiUrl(['subscriber', userID, 'all-passwords']))
        .then(async res => {
          if (!res.data) {
            ctx.scene.text = text.no_sites
            ctx.scene.kb = exit_kb
            await ctx.scene.reenter();
          } else {
            ctx.scene.text = '';
            await res.data.map(el => {
              ctx.scene.text += `${el.site_name}  _________  <code>${el.password}</code>\n\n`
            })
            ctx.scene.kb = default_kb
            await ctx.scene.leave();
          }
        })
        .catch(err => console.log(err))
    })

    getAllPasswords.leave(ctx => ctx.replyWithHTML(ctx.scene.text, ctx.scene.kb))

    return getAllPasswords;
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
            await ctx.reply(text.wrong_site)
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
              await ctx.reply(text.wrong_site)
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
              await ctx.reply(text.wrong_site)
            }
          })
          .catch(err => console.log(err))
      } else {
        await ctx.reply('Ты ввёл не верную запись \n\n' + text.instruction.edit)
      }
      ctx.scene.leave();

    })
    return editPasswordOrSite;
  }
}
