const bcrypt = require("bcrypt");
const { handleException } = require("../../helpers/exception");
const Response = require("../../helpers/response");
const Constant = require("../../helpers/constant");
const ProfileValidation = require("../../helpers/joi-validation");
const { ObjectId } = require("mongodb");
const mongodb = require("mongodb");
const _ = require("underscore");
const {
  Find,
  Insert,
  InsertOne,
  Aggregation,
  UpdateOne,
  FindOne,
} = require("../../library/methods");
/**
 * Create Leads
 */
const createLeads = async (req, res) => {
  const { logger } = req;
  try {
    let apikey = req.headers["x-api-key"];
    const apiKeyData = await FindOne("apiKey", { keyToken: apikey });
    if (!apiKeyData) {
      const obj = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.ERROR_MSGS.UN_AUTHORIZED,
      };
      return Response.error(obj);
    }
    // req.body.apikey = new ObjectId(apikey);
    req.body.LeadsOwnerId = new ObjectId(apiKeyData.createdByUser);
    req.body.organizationId = new ObjectId(apiKeyData.organizationId);
    req.body.createdTime = new Date();
    req.body.updatedTime = null;
    // Create Lead
    await InsertOne("leads", req.body);
    const obj = {
      res,
      msg: Constant.INFO_MSGS.CREATED_SUCCESSFULLY,
      status: Constant.STATUS_CODE.OK,
      // data: userDetails,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

module.exports = {
  createLeads,
};
