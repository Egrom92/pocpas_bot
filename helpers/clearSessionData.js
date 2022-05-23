module.exports = (ctx) => {
  ctx.session.sendRequestAgain = false
  ctx.session.url = null
  ctx.session.sceneName = null
  ctx.session.params = null
}