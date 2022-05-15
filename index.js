const {Telegraf, Scenes, session, Markup} = require('telegraf');
require('dotenv').config()
const text = require('./text.json')
const bot = new Telegraf(process.env.BOT_TOKEN)

const SceneGenerator = require('./scenes/Scenes')
const {exit_kb} = require("./keyboards");
const curScene = new SceneGenerator()
const checkMasterPassword = curScene.checkMasterPassword()
const createMasterPassword = curScene.createMasterPassword()
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
  await ctx.reply('Введите название сайта', exit_kb)
  await ctx.scene.enter(isAuthorized(ctx, 'createPassword'))
})

bot.hears('Запросить пароль', async ctx => {
  await ctx.reply('Введите название сайта', exit_kb)
  await ctx.scene.enter(isAuthorized(ctx, 'getPassword'))
});

bot.hears('Посмотреть все пароли', async ctx => {
  await ctx.reply('Идёт запрос на сервер', exit_kb)
  await ctx.scene.enter(isAuthorized(ctx, 'getAllPasswords'))
});

bot.hears('Удалить пароль', async ctx => {
  await ctx.reply('Введите название сайта', exit_kb)
  await ctx.scene.enter(isAuthorized(ctx, 'deletePassword'))
})

bot.hears('Редактировать пароль', async ctx => {
  await ctx.reply('Введите название сайта', exit_kb)
  await ctx.scene.enter(isAuthorized(ctx, 'editPassword'))
})

bot.launch()
  .then((res, req) => {
    console.log('Started');
  })
  .catch(err => console.log(err))
