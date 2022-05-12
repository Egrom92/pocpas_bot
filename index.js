const {Telegraf, Scenes, session} = require('telegraf');
require('dotenv').config()
const text = require('./text.json')
const bot = new Telegraf(process.env.BOT_TOKEN)

const SceneGenerator = require('./scenes/Scenes')
const curScene = new SceneGenerator()
const checkMasterPassword = curScene.checkMasterPasswordScene()
const createMasterPassword = curScene.createMasterPassword()
const enterMasterPassword = curScene.enterMasterPassword()
const createPassword = curScene.createPassword()
const getPassword = curScene.getPassword()
const editPasswordOrSite = curScene.editPasswordOrSite()
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
  editPasswordOrSite,
  deletePassword
])

bot.use(session());
bot.use(stage.middleware());

bot.help(async ctx => {
  ctx.session.authorized ? ctx.reply(text.instruction) : ctx.reply(text.help)
  await console.log(ctx.session);
})

bot.start(async ctx => {
  await ctx.scene.enter('checkMasterPassword')
})

bot.command('get', async ctx => {
  await ctx.scene.enter(isAuthorized(ctx, 'getPassword'))
});

bot.command('del', async ctx => {
  await ctx.scene.enter(isAuthorized(ctx, 'deletePassword'))
})

bot.command('add', async ctx => {
  await ctx.scene.enter(isAuthorized(ctx, 'createPassword'))
})

bot.command('edit', async ctx => {
  await ctx.scene.enter(isAuthorized(ctx, 'editPasswordOrSite'))
})

bot.launch()
  .then((res, req) => {
    console.log('Started');
  })
  .catch(err => console.log(err))
