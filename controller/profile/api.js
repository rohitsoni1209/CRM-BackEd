const bcrypt = require("bcrypt");
const { handleException } = require("../../helpers/exception");
const Response = require("../../helpers/response");
const Constant = require("../../helpers/constant");
const ProfileValidation = require("../../helpers/joi-validation");
const { downloadData } = require("../../utility/dataDownload");
const { ObjectId } = require("mongodb");
const mongodb = require("mongodb");
const randomString = require("crypto-random-string");
const _ = require("underscore");
const { uploadFile } = require("../../utility/uploadData");

const {
  Find,
  Insert,
  InsertOne,
  Aggregation,
  UpdateOne,
  FindOne,
} = require("../../library/methods");
/**
 * Create Api Key
 */
const createApiKey = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    const { apiTitle } = req.body;
    // Create Roles
    // Email Token Verification
    const keyToken = randomString({
      length: 20,
      type: "url-safe",
    });

    await InsertOne("apiKey", {
      apiTitle,
      keyToken,
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
 * Get Api Key
 */
const getApiKey = async (req, res) => {
  const { logger } = req;
  try {
    const { organizationId } = req.decoded;
    // //console.log('organizationId',organizationId)
    const apiKeyList = await Find(
      "apiKey",
      { organizationId: new ObjectId(organizationId) },
      0,
      parseInt(1000),
      {}
    );
    if (!apiKeyList) {
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
      data: apiKeyList,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

/**
 * Separate Organization's Download All DB Data
 */
const downloadAllDBdata = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;

    //Download Data From DataBase
    const data = await downloadData(logger, organizationId);
    const file = JSON.stringify(data);

    // Upload Data On AWS
    await uploadFile(file, organizationId)
      .then(async (fileUrl) => {
        // //console.log("File URL:", fileUrl);
        const BackupPayload = {
          dataLink: fileUrl,
          organizationId: new ObjectId(organizationId),
          dataOwnerId: new ObjectId(userId),
          createdTime: new Date(),
          updatedTime: new Date(),
        };

        //SAVE UPLOADED DATA
        const saveData = await InsertOne("dataBackup", BackupPayload);
        if (!saveData) {
          const resp = {
            res,
            status: Constant.STATUS_CODE.BAD_REQUEST,
            msg: Constant.ERROR_MSGS.DATA_NOT_FOUND,
          };
          return Response.error(resp);
        }
        const obj = {
          res,
          msg: Constant.INFO_MSGS.DOWNLOADED_SUCCESSFULLY,
          status: Constant.STATUS_CODE.OK,
          data: fileUrl,
        };
        return Response.success(obj);
      })
      .catch((error) => {
        //console.log("error", error);
        return handleException(logger, res, error);
      });
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

/**
 * Get Download Data Link
 */

const getdownloadDataLink = async (req, res) => {
  const { logger } = req;
  try {
    const { organizationId } = req.decoded;
    let { sortBy, offset, limit } = req.query;

    let queryObj = req.query;
    delete queryObj.offset;
    delete queryObj.sortBy;
    delete queryObj.limit;
    let queryObjKeys = Object.keys(queryObj);
    const orCondition = [];

    for (let key of queryObjKeys) {
      orCondition.push({ [key]: queryObj[key] });
    }
    if (sortBy === "recent") {
      sortBy = { createdTime: -1 };
    } else {
      sortBy = { createdTime: 1 };
    }
    offset = offset || 1;
    limit = limit || 10;
    const skip = limit * (offset - 1);
    let matchCondition = {};

    matchCondition.organizationId = new ObjectId(organizationId);
    //console.log("organizationId", organizationId);
    if (orCondition.length) {
      matchCondition = { ...matchCondition, $or: orCondition };
    }

    let aggregationQuery = [
      {
        $match: matchCondition,
      },
      {
        $lookup: {
          from: "organization",
          localField: "organizationId",
          foreignField: "_id",
          as: "organizationData",
        },
      },
      {
        $unwind: {
          path: "$organizationData",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          let: { ownerId: "$dataOwnerId" },
          from: "users",
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$ownerId"] },
              },
            },
            { $project: { _id: 1, firstName: 1, lastName: 1 } },
          ],
          as: "ownerData",
        },
      },
      {
        $unwind: {
          path: "$ownerData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $facet: {
          paginatedResult: [{ $skip: skip }, { $limit: parseInt(limit) }],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const backupData = await Aggregation("dataBackup", aggregationQuery);
    if (!backupData[0].paginatedResult.length) {
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
      data: {
        backupData: backupData[0].paginatedResult,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: backupData[0].totalCount[0].count,
        },
      },
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

module.exports = {
  createApiKey,
  getApiKey,
  downloadAllDBdata,
  getdownloadDataLink,
};
