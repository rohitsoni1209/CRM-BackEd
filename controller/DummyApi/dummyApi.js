const { handleException } = require("../../helpers/exception");
const Response = require("../../helpers/response");
const Constant = require("../../helpers/constant");
const {
  returnFilterByFieldQuery,
  returnFilterButton,
} = require("../../utility/filter");
const deleteAllRecord = require("../../utility/deleteAllRecord");
const { ObjectId } = require("mongodb");
const _ = require("underscore");
const {
  InsertOne,
  Aggregation,
  UpdateOne,
  FindOne,
  UpdateMany,
  DeleteMany,
} = require("../../library/methods");
/**
 * Create DummyData
 */
const AddDummyData = async (req, res) => {
  const { logger } = req;
  try {
    req.body.createdTime = new Date();
    req.body.updatedTime = new Date();

    // Create DummyData
    await InsertOne("dummy", req.body);
    const obj = {
      res,
      msg: Constant.INFO_MSGS.CREATED_SUCCESSFULLY,
      status: Constant.STATUS_CODE.OK,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

module.exports = {
  AddDummyData,
};
