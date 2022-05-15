const {Markup} = require("telegraf");
module.exports.exit_kb = Markup.keyboard([['Отмена']]).oneTime().resize();
module.exports.default_kb = Markup.keyboard([['Добавить пароль', 'Запросить пароль'], ['Посмотреть все пароли'], ['Редактировать пароль', 'Удалить пароль']]).resize()
module.exports.remove_kb = Markup.removeKeyboard();