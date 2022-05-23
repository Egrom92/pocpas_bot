module.exports = (ctx, options) => {
  ctx.session.sendRequestAgain = true
  ctx.session.url = options.url
  ctx.session.sceneName = options.scene
  ctx.session.params = options.params
}