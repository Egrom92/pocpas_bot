const {Telegraf, Scenes, session} = require('telegraf');
require('dotenv').config()
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

let authorized = false
let greeted = false


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
  ctx.reply('Акаунт создан \n\n' +
    'Создать новый пароль -> \n/add {название сайта} \n\n' +
    'Запросить пароль -> \n/get {название сайта} \n\n' +
    'Запроси список сайтов - \n/all \n\n' +
    'Удалить сайт -> \n/del {название сайта} \n\n' +
    'Редактировать сайт -> \n/edit {название старого сайта} {название нового сайта} \n\n' +
    'Редактировать пароль -> \n/edit {название сайта сайта}')
})

bot.start(async ctx => {
  await ctx.scene.enter('checkMasterPassword')
})

bot.command('get', async ctx => {
    return await ctx.scene.enter('getPassword')
});

bot.command('del', async ctx => {
  await ctx.scene.enter('deletePassword')
})

bot.command('add', ctx => {
  ctx.scene.enter('createPassword')
})

bot.command('edit', ctx => {
  ctx.scene.enter('editPasswordOrSite')
})

bot.launch()
  .then((res, req) => {
    console.log('Started');
  })
  .catch(err => console.log(err))
