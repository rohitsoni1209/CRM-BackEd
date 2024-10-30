const bcrypt = require('bcrypt');
const { handleException } = require('../../helpers/exception');
const Response = require('../../helpers/response');
const Constant = require('../../helpers/constant');
const { makeCall } = require('../../utility/makeCall');
const _ = require('underscore');

/**
 * Make call
 */
const MakeCall = async (req, res) => {
  const { logger } = req;
  try {
    const { customer_number } = req.body
    const callPayload = {
      customer_number: `+91${customer_number}`
    }
    makeCall(callPayload).then(response => {
      //console.log('API call successful:', response);
      const obj = {
        res,
        msg: Constant.INFO_MSGS.SUCCESS,
        status: Constant.STATUS_CODE.OK,
        data: response
      };
      return Response.success(obj);
    })
      .catch(error => {
        console.error('API call failed:', error);
        const obj = {
          res,
          msg: error,
          status: Constant.STATUS_CODE.UN_AUTHORIZED,
          // data:error
        };
        return Response.success(obj);
      });
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

module.exports = {
  MakeCall
}
