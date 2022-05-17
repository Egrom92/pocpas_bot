const {Scenes, Markup} = require('telegraf')
const text = require('../text.json')
const axios = require('axios');
const getApiUrl = require("../helpers/getApiUrl");
const isKyr = require("../helpers/isKyr");
const replyAndDestroy = require('../helpers/replyAndDestroy')
const noSiteAndReenter = require('../helpers/noSiteAndReenter')
const leaveSceneButton = require('../helpers/leaveSceneButton')
const checkSymbols = require('../helpers/checkSymbols')
const {exit_kb, default_kb, remove_kb} = require('../keyboards')


module.exports = class SceneGenerator {
  checkMasterPassword() {
    const checkMasterPassword = new Scenes.BaseScene('checkMasterPassword')

    checkMasterPassword.enter(async (ctx) => {
      const userID = ctx.message.from.id
      await axios.get(getApiUrl(['subscriber', userID]))
        .then(async res => {
          if (res.data) {
            ctx.scene.text = text.enter_master_password
            ctx.scene.kb = exit_kb
            await ctx.scene.enter('enterMasterPassword')
          } else {
            ctx.scene.text = text.create_master_password
            ctx.scene.kb = exit_kb
            await ctx.scene.enter('createMasterPassword')
          }
        })
        .catch(err => console.log(err))
    })

    checkMasterPassword.leave(ctx => ctx.replyWithHTML(ctx.scene.text, ctx.scene.kb))
    return checkMasterPassword
  }

  enterMasterPassword() {
    const enterMasterPassword = new Scenes.BaseScene('enterMasterPassword')
    leaveSceneButton(enterMasterPassword, {keyboard: remove_kb, text: 'Для начала работы, нажми /start'});
    enterMasterPassword.on('text', async ctx => {
      const userID = ctx.message.from.id
      const pass = ctx.message.text

      if (await checkSymbols(ctx)) return

      if (!isKyr(pass)) {
        await axios.get(getApiUrl(['subscriber', userID, 'master-password', ctx.message.text]))
          .then(async res => {
            if (res.data) {
              await ctx.deleteMessage()
              ctx.session.authorized = true;
              ctx.scene.text = text.right_master_password
              ctx.scene.kb = default_kb
              await ctx.scene.leave();
            } else {
              ctx.scene.text = text.wrong_master_password
              ctx.scene.kb = remove_kb
              await ctx.scene.reenter()
            }
          })
          .catch(async err => {
            await console.log(err)
          })
      } else {
        ctx.scene.text = text.wrong_master_password
        ctx.scene.kb = remove_kb
        await ctx.scene.reenter()
      }
    })
    enterMasterPassword.leave(ctx => ctx.replyWithHTML(ctx.scene.text, ctx.scene.kb))
    return enterMasterPassword
  }

  createMasterPassword() {
    const createMasterPassword = new Scenes.BaseScene('createMasterPassword')
    leaveSceneButton(createMasterPassword, {keyboard: remove_kb, text: 'Для начала работы, нажми /start'});
    createMasterPassword.on('text', async ctx => {
      const pass = ctx.message.text;

      if (await checkSymbols(ctx)) return

      if (pass) {
        if (!isKyr(pass)) {
          const {id, first_name, last_name, username, language_code} = ctx.message.from
          const query = {
            tg_id: id, first_name, last_name, username, language_code, master_password: pass
          }
          axios.post(getApiUrl('subscriber'), query)
            .then(async res => {
              if (res.data) {
                ctx.scene.text = text.new_subscriber
                ctx.scene.kb = default_kb
                await ctx.scene.leave()
              }
            })
            .catch(err => console.log(err))
        } else {
          ctx.scene.text = text.no_cyrillic
          ctx.scene.kb = remove_kb
          await ctx.scene.reenter()
        }
      }
    })

    createMasterPassword.leave(ctx => ctx.replyWithHTML(ctx.scene.text, ctx.scene.kb))
    return createMasterPassword
  }

  createPassword() {
    const createPassword = new Scenes.BaseScene('createPassword')

    leaveSceneButton(createPassword);

    createPassword.on('text', async ctx => {
      const userID = ctx.message.from.id
      const keyword = ctx.message.text

      if (await checkSymbols(ctx)) return

      await axios.post(getApiUrl(['subscriber', userID, 'password']), {keyword})
        .then(res => {
          if (res.data.status) {
            ctx.scene.text = `Твоё ключевое влово ${keyword} и пароль <code>${res.data.pass}</code>`;
          } else
            ctx.scene.text = `Ключевое влово ${keyword} уже было, пароль <code>${res.data.pass}</code>`;
        })
        .catch(err => console.log(err))
      ctx.scene.kb = default_kb
      await ctx.scene.leave();
    })
    createPassword.leave(ctx => ctx.replyWithHTML(ctx.scene.text, ctx.scene.kb))

    return createPassword
  }

  getPassword() {
    const getPassword = new Scenes.BaseScene('getPassword')

    leaveSceneButton(getPassword);

    getPassword.on('text', async ctx => {
      const userID = ctx.message.from.id
      const keyword = ctx.message.text

      if (await checkSymbols(ctx)) return

      await axios.get(getApiUrl(['subscriber', userID, 'password'], {keyword}))
        .then(async res => {
          if (!res.data) {
            await noSiteAndReenter(ctx)
          } else {
            ctx.scene.text = `${res.data.keyword}  _________  <code>${res.data.password}</code>`
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

    leaveSceneButton(getAllPasswords);

    getAllPasswords.enter(async ctx => {
      const userID = ctx.message.from.id
      await axios.get(getApiUrl(['subscriber', userID, 'all-passwords']))
        .then(async res => {

          if (!res.data) {
            ctx.scene.text = text.no_keywords
            ctx.scene.kb = default_kb
          } else {
            ctx.session.passwords = res.data
            const buttons = [];

            await res.data.forEach(el => {
              buttons.push([Markup.button.callback(el.keyword, JSON.stringify({
                pass: el.password,
                type: 'PASSWORD',
                key: el.keyword
              }))])
            })
            ctx.scene.text = 'Ваши пароли'
            ctx.scene.kb = Markup.inlineKeyboard(buttons)
          }
        })
        .catch(err => console.log(err))
      await ctx.scene.leave();
    })

    getAllPasswords.leave(ctx => ctx.replyWithHTML(ctx.scene.text, ctx.scene.kb))

    return getAllPasswords;
  }

  editPassword() {
    const editPassword = new Scenes.BaseScene('editPassword')

    leaveSceneButton(editPassword);

    editPassword.on('text', async ctx => {
      const userID = ctx.message.from.id
      const keyword = ctx.message.text

      await axios.patch(getApiUrl(['subscriber', userID, 'password'], {keyword}))
        .then(async res => {
          if (res.data) {
            ctx.scene.text = `${keyword}  _________  <code>${res.data}</code>\n\n`
            ctx.scene.kb = default_kb
            await ctx.scene.leave();
          } else {
            await noSiteAndReenter(ctx)
          }
        })
        .catch(err => console.log(err))
    })

    editPassword.leave(ctx => ctx.replyWithHTML(ctx.scene.text, ctx.scene.kb))

    return editPassword;
  }

  deletePassword() {
    const deletePassword = new Scenes.BaseScene('deletePassword')

    leaveSceneButton(deletePassword);

    deletePassword.on('text', async ctx => {
      const userID = ctx.message.from.id
      const keyword = ctx.message.text

      await axios.delete(getApiUrl(['subscriber', userID, 'password'], {keyword}))
        .then(async res => {
          if (res.data) {
            ctx.scene.text = `Пароль с ключевым словом ${keyword}, удалён`
            ctx.scene.kb = default_kb
            await ctx.scene.leave();
          } else {
            await noSiteAndReenter(ctx)
          }
        })
        .catch(err => console.log(err))
    })

    deletePassword.leave(ctx => ctx.replyWithHTML(ctx.scene.text, ctx.scene.kb))

    return deletePassword;
  }

}
