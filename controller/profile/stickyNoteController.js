const bcrypt = require("bcrypt");
const { handleException } = require("../../helpers/exception");
const Response = require("../../helpers/response");
const Constant = require("../../helpers/constant");
const ProfileValidation = require("../../helpers/joi-validation");
const { ObjectId } = require("mongodb");
const mongodb = require("mongodb");
const randomString = require("crypto-random-string");
const _ = require("underscore");
const {
  Find,
  Insert,
  InsertOne,
  Aggregation,
  UpdateOne,
  FindOne,
  PermanentDelete,
  DeleteMany,
} = require("../../library/methods");
/**
 * Create sticky
 */
const createSticky = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    const { title, text } = req.body;
    req.body.timeStamp = new Date(req.body.timeStamp);
    // Create sticky
    await InsertOne("stickyNote", {
      title,
      text,
      timeStamp: req.body.timeStamp,
      organizationId: new ObjectId(organizationId),
      createdByUser: new ObjectId(userId),
      createdTime: new Date(),
      updatedTime: new Date(),
    });
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

/**
 * Update sticky
 */
const updateSticky = async (req, res) => {
  const { logger } = req;
  try {
    //console.log("Hello");
    // const { title, text } = req.body;
    // req.body.timeStamp = new Date(req.body.timeStamp);
    // const { stickyId } =  req.params;

    // Create sticky
    // await UpdateOne('stickyNote', {_id : new ObjectId(stickyId)}, {
    //     title,
    //     text,
    //     timeStamp : req.body.timeStamp,
    // })
    const { userId, organizationId } = req.decoded;
    // //console.log(userId)
    const deletedata = await DeleteMany("stickyNote", {
      createdByUser: new ObjectId(userId),
    });
    //console.log(deletedata);

    for (data of req.body) {
      timeStampS = new Date(data.timeStamp);
      await InsertOne("stickyNote", {
        title: data.title,
        text: data.text,
        timeStamp: timeStampS,
        organizationId: new ObjectId(organizationId),
        createdByUser: new ObjectId(userId),
        createdTime: new Date(),
        updatedTime: new Date(),
      });
    }
    const obj = {
      res,
      msg: Constant.INFO_MSGS.UPDATED_SUCCESSFULLY,
      status: Constant.STATUS_CODE.OK,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

/**
 * Get sticky
 */
const getSticky = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    // //console.log('organizationId',organizationId)
    const sticky = await Find(
      "stickyNote",
      {
        organizationId: new ObjectId(organizationId),
        createdByUser: new ObjectId(userId),
      },
      0,
      parseInt(1000),
      {}
    );
    if (!sticky) {
      const resp = {
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.INFO_MSGS.NO_DATA,
      };
      throw resp;
    }

    const obj = {
      res,
      msg: Constant.INFO_MSGS.SUCCESS,
      status: Constant.STATUS_CODE.OK,
      data: sticky,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

/**
 * Delete sticky
 */
const deleteSticky = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    const { stickyId } = req.params;
    // Create sticky
    await PermanentDelete("stickyNote", { _id: new ObjectId(stickyId) });
    const obj = {
      res,
      msg: Constant.INFO_MSGS.DELETE_SUCCESSFULLY,
      status: Constant.STATUS_CODE.OK,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

module.exports = {
  createSticky,
  getSticky,
  deleteSticky,
  updateSticky,
};
