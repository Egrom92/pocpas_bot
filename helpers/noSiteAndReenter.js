const text = require("@/text.json");
const {exit_kb} = require("@/keyboards");
module.exports = async function (ctx) {
  ctx.scene.text = text.wrong_site
  ctx.scene.kb = exit_kb
  await ctx.scene.reenter();
}