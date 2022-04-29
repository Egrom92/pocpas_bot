module.exports = isKyr = function (str) {
  return /[а-яё]/i.test(str);
}