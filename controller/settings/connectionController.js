
const bcrypt = require('bcrypt');
const { handleException } = require('../../helpers/exception');
const Response = require('../../helpers/response');
const Constant = require('../../helpers/constant');
const ProfileValidation = require('../../helpers/joi-validation');
const TimeLine = require('../../helpers/timeline');
const { ObjectId } = require('mongodb');
const mongodb = require('mongodb');
const _ = require('underscore');
const { Find, Insert, InsertOne, Aggregation, UpdateOne, FindOne, Count } = require("../../library/methods");

/**
 *  getTimeLineByConnectionId
 */
const getTimeLineByConnectionId = async (req, res) => {
  const { logger } = req;
  try {
    const { id } = req.params;
    // Create call
    let _id = ""
    if (id && id.includes("&ownerName")) {
      let newKey = id.split("&")
      _id = newKey[0];
    } else {
      _id = id
    }
    const infoData = await Find('timeline', { connectionId: new ObjectId(_id) })

    if (!infoData) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.INFO_MSGS.NO_DATA,
      };
      return Response.error(resp);
    }
    const obj = {
      res,
      msg: Constant.INFO_MSGS.SUCCESS,
      status: Constant.STATUS_CODE.OK,
      data: infoData
    };
    return Response.success(obj);
  } catch (error) {
    //console.log('error', error)
    return handleException(logger, res, error);
  }
};



module.exports = {
  getTimeLineByConnectionId,
}