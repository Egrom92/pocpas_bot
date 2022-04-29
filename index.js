const {Telegraf, Scenes, session} = require('telegraf');
require('dotenv').config()
const bot = new Telegraf(process.env.BOT_TOKEN)


const SceneGenerator = require('./scenes/Scenes')
const curScene = new SceneGenerator()
const checkMasterPassword = curScene.checkMasterPasswordScene()
const createMasterPassword = curScene.createMasterPassword()
const enterMasterPassword = curScene.enterMasterPassword()

let authorized = false
let greeted = false


const stage = new Scenes.Stage([checkMasterPassword, createMasterPassword, enterMasterPassword])

bot.use(session());
bot.use(stage.middleware());


bot.help(async ctx => {
  console.log(ctx.message);
  console.log('-------------');
})

bot.start(async ctx => {
  await ctx.scene.enter('checkMasterPassword')
})

bot.command('get', async ctx => {
  if (!authorized) {
    return await ctx.scene.enter('masterPassword')
  }
  ctx.reply('Вот вам список пароль')
});

bot.command('all', async ctx => {
  if (!authorized) {
    return await ctx.scene.enter('masterPassword')
  }
  ctx.reply('Вот вам список пароль')
});



bot.launch()
.then((res, req) => {
  console.log('Started');
})
.catch(err => console.log(err))
