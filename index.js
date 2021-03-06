const {Telegraf, Scenes, session} = require('telegraf');
require('module-alias/register')
require('dotenv').config()
const text = require('./text.json')
const bot = new Telegraf(process.env.BOT_TOKEN)
const {showPassword} = require('@/helpers')
const SceneGenerator = require('./scenes/Scenes')
const {exit_kb, default_kb} = require("./keyboards");
const curScene = new SceneGenerator()
const checkMasterPassword = curScene.checkMasterPassword()
const createMasterPassword = curScene.createMasterPassword()
const sendRequestAgain = curScene.sendRequestAgain()
const enterMasterPassword = curScene.enterMasterPassword()
const createPassword = curScene.createPassword()
const getPassword = curScene.getPassword()
const getAllPasswords = curScene.getAllPasswords()
const editPassword = curScene.editPassword()
const deletePassword = curScene.deletePassword()

const isAuthorized = (ctx, scene = 'checkMasterPassword') => {
  if (ctx.session.authorized) {
    return scene;
  } else {
    return 'checkMasterPassword'
  }
}

const stage = new Scenes.Stage([
  checkMasterPassword,
  createMasterPassword,
  enterMasterPassword,
  sendRequestAgain,
  createPassword,
  getPassword,
  getAllPasswords,
  editPassword,
  deletePassword
])

bot.use(session());
bot.use(stage.middleware());

bot.help(async ctx => {
  ctx.session.authorized ? ctx.reply(text.help) : ctx.reply(text.help)
})

bot.start(async ctx => {
  await ctx.scene.enter('checkMasterPassword')
})

bot.hears('Добавить пароль', async ctx => {
  await ctx.reply('Придумай ключевое слово', exit_kb)
  await ctx.scene.enter(isAuthorized(ctx, 'createPassword'))
})

bot.hears('Запросить пароль', async ctx => {
  await ctx.reply('Введи ключевое слово', exit_kb)
  await ctx.scene.enter(isAuthorized(ctx, 'getPassword'))
});

bot.hears('Посмотреть все пароли', async ctx => {
  await ctx.reply('Идёт запрос на сервер', default_kb)
  await ctx.scene.enter(isAuthorized(ctx, 'getAllPasswords'))
});

bot.hears('Удалить пароль', async ctx => {
  await ctx.reply('Введи ключевое слово', exit_kb)
  await ctx.scene.enter(isAuthorized(ctx, 'deletePassword'))
})

bot.hears('Редактировать пароль', async ctx => {
  await ctx.reply('Введи ключевое слово', exit_kb)
  await ctx.scene.enter(isAuthorized(ctx, 'editPassword'))
})

bot.on("callback_query", async ctx => {
  const {type, password} = JSON.parse(ctx.callbackQuery.data)

  switch (type) {
    case 'PASSWORD':
      await ctx.deleteMessage();
      const {text, keyboard} = showPassword(password)
      await ctx.replyWithHTML(text, keyboard)
      break;
    case 'CLEAR_PASSWORD' :
      await ctx.deleteMessage();
      break
  }
})

bot.launch()
  .then((res, req) => {
    console.log('Started');
  })
  .catch(err => console.log(err))
