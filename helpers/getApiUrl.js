require('dotenv').config()

module.exports = function(path = '', query = {}) {
  let address = `${process.env.CMS_URL}`+ '/api'

    if(Array.isArray(path)) {
      path.map(el => {
        address = address + '/' + el
      })
    } else {
      address = address + '/' + path
    }


  let i = 0;
  for (const [key, value] of Object.entries(query)) {
    if (i === 0) {
      address += `?`;
    } else {
      address += `&`;
    }
    address += `${key}=${value}`;
    i++;
  }

  console.log(address);
  return address
}