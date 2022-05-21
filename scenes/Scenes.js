const {Scenes, Markup} = require('telegraf')
const text = require('../text.json')
const axios = require('axios');
const {setPasswordKeyboard, noSiteAndReenter, leaveSceneButton, checkSymbols, getApiUrl, isKyr} = require(`@/helpers`)
const {exit_kb, default_kb, remove_kb} = require(`@/keyboards`)


module.exports = class SceneGenerator {
  checkMasterPassword() {
    const checkMasterPassword = new Scenes.BaseScene('checkMasterPassword')

    checkMasterPassword.enter(async (ctx) => {
      const userID = ctx.message.from.id
      await axios.get(getApiUrl(['subscriber', userID]))
        .then(async res => {
          if (res.data) {
            ctx.scene.text = text.enter_master_password
            ctx.scene.keyboard = exit_kb
            await ctx.scene.enter('enterMasterPassword')
          } else {
            ctx.scene.text = text.create_master_password
            ctx.scene.keyboard = exit_kb
            await ctx.scene.enter('createMasterPassword')
          }
        })
        .catch(err => console.log(err))
    })

    checkMasterPassword.leave(ctx => ctx.replyWithHTML(ctx.scene.text, ctx.scene.keyboard))
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
              ctx.scene.keyboard = default_kb
              await ctx.scene.leave();
            }
          })
          .catch(async err => {
            await console.log(err)
          })
      }
      ctx.scene.text = text.wrong_master_password
      ctx.scene.keyboard = exit_kb
      await ctx.scene.reenter()
    })
    enterMasterPassword.leave(ctx => ctx.replyWithHTML(ctx.scene.text, ctx.scene.keyboard))
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
                ctx.scene.keyboard = default_kb
                await ctx.scene.leave()
              }
            })
            .catch(err => console.log(err))
        } else {
          ctx.scene.text = text.no_cyrillic
          ctx.scene.keyboard = remove_kb
          await ctx.scene.reenter()
        }
      }
    })

    createMasterPassword.leave(ctx => ctx.replyWithHTML(ctx.scene.text, ctx.scene.keyboard))
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
        .then(async res => {
          await setPasswordKeyboard(ctx, res.data.password)
        })
        .catch(err => console.log(err))
      ctx.scene.keyboard = default_kb
      await ctx.scene.leave();
    })
    createPassword.leave(async ctx => ctx.replyWithHTML(ctx.scene.text, ctx.scene.keyboard))

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
            await setPasswordKeyboard(ctx, res.data.password)
          }
        })
        .catch(err => console.log(err))
    })
    getPassword.leave(async ctx => ctx.replyWithHTML(ctx.scene.text, ctx.scene.keyboard))

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
            ctx.scene.keyboard = default_kb
          } else {
            const buttons = [];

            await res.data.forEach(el => {
              buttons.push([Markup.button.callback(el.keyword, JSON.stringify({
                password: el.password,
                type: 'PASSWORD'
              }))])
            })
            ctx.scene.text = 'Ваши пароли'
            ctx.scene.keyboard = Markup.inlineKeyboard(buttons)
          }
        })
        .catch(err => console.log(err))
      await ctx.scene.leave();
    })

    getAllPasswords.leave(ctx => ctx.replyWithHTML(ctx.scene.text, ctx.scene.keyboard))

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
            await setPasswordKeyboard(ctx, res.data)
          } else {
            await noSiteAndReenter(ctx)
          }
        })
        .catch(err => console.log(err))
    })

    editPassword.leave(async ctx => ctx.replyWithHTML(ctx.scene.text, ctx.scene.keyboard))

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
            ctx.scene.keyboard = default_kb
            await ctx.scene.leave();
          } else {
            await noSiteAndReenter(ctx)
          }
        })
        .catch(err => console.log(err))
    })

    deletePassword.leave(async ctx => ctx.replyWithHTML(ctx.scene.text, ctx.scene.keyboard))

    return deletePassword;
  }

}
