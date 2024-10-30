const Constant = require('./constant');
const Response = require('./response');

const handleException = (logger, res, error) => {

  const obj = {
    res,
    status: Constant.STATUS_CODE.INTERNAL_SERVER_ERROR,
    msg: error || Constant.ERROR_MSGS.INTERNAL_SERVER_ERROR,
  };
  return Response.error(obj);
};
const isHexadecimal = (s) => {
  try {
    // Attempt to parse the string as an integer in base 16 (hexadecimal)
    let value = parseInt(s, 16);
    return !isNaN(value); // If successful, the string is hexadecimal
  } catch (e) {
    return false; // If an exception is caught, the string is not hexadecimal
  }
}
module.exports = { handleException, isHexadecimal };
