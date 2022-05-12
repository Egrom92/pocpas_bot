const {Scenes} = require('telegraf')
const text = require('../text.json')
const axios = require('axios');
const getApiUrl = require("../helpers/getApiUrl");
const isKyr = require("../helpers/isKyr");
const replyAndDestroy = require('../helpers/replyAndDestroy')


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
              await ctx.reply('Вы ввели верный пароль \n\n' + text.instruction.all)

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
    createPassword.enter(async ctx => {
      const userID = ctx.message.from.id
      const site = ctx.message.text.replace('/add', '').trim()

      if (!site.length) {
        await ctx.reply('Ты забыл написать название сайта \n \n' +
          text.instruction.add)
      } else {
        axios.post(getApiUrl(['subscriber', userID, 'password']), {site})
          .then(res => {
            if (res.data.status) {
              replyAndDestroy(ctx, [`Твой сайт ${site} и пароль <code>${res.data.pass}</code>`, 'HTML'])
            } else
              replyAndDestroy(ctx, [`${site} уже был есть и пароль <code>${res.data.pass}</code>`, 'HTML'])
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
      const info_text = {
        multiSite: 'У тебя сайтов пока нету \n\n' +
          text.instruction.add,
        oneSite: text.wrong_site
      }

      await axios.get(getApiUrl(['subscriber', userID, 'password'], {site}))
        .then(async res => {
          if (!res.data.length) {
            await replyAndDestroy(ctx, site === '*' ? info_text.multiSite : info_text.oneSite)
          } else {
            let allPasswords = '';
            await res.data.map(el => {
              allPasswords += `${el.site_name}  _________  <code>${el.password}</code>\n\n`
            })
            await replyAndDestroy(ctx, [allPasswords, 'HTML'])
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
