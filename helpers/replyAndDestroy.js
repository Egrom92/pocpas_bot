module.exports = async function replyAndDestroy(ctx, reply, timeout = 10000) {
  let replyResponse
  if (typeof reply === "string") {
    replyResponse = await ctx.reply(reply)
  } else if (typeof reply === "object") {
    replyResponse = await ctx.reply(reply[0] || '', {parse_mode: reply[1] || 'HTML'})
  }
  setTimeout(()=> {
    ctx.deleteMessage(replyResponse.message_id)
  }, timeout)
}