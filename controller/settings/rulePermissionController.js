const bcrypt = require("bcrypt");
const { handleException } = require("../../helpers/exception");
const Response = require("../../helpers/response");
const { returnFilterByFieldQuery } = require("../../utility/filter");
const Constant = require("../../helpers/constant");
const deleteAllRecord = require("../../utility/deleteAllRecord");
const { ObjectId } = require("mongodb");
const TimeLine = require("../../helpers/timeline");
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
 * Create Rule Permission
 */

const createRulePermission = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    var DataObj = {};
    //console.log(organizationId);

    DataObj.PermissionsOwnerId = new ObjectId(userId);
    DataObj.organizationId = new ObjectId(organizationId);
    DataObj.createdTime = new Date();
    DataObj.updatedTime = new Date();

    const RuleData = req.body.data;
    //console.log("Dataa-->", req.body.data);
    //console.log("RuleData.length", RuleData.length);
    for (let i = 0; i < RuleData.length; i++) {
      const DocId = RuleData[i]?._id;

      let dataFound = await FindOne("permission", {
        organizationId: new ObjectId(organizationId),
        moduleTitle: RuleData[i].moduleTitle,
      });
      if (!dataFound) {
        DataObj["_id"] = new ObjectId();
        DataObj["moduleTitle"] = RuleData[i].moduleTitle;
        DataObj["Private"] = RuleData[i].Private;
        DataObj["read"] = RuleData[i].read;
        DataObj["write"] = RuleData[i].write;
        DataObj["delete"] = RuleData[i].delete;
        await InsertOne("permission", DataObj);
      } else {
        DataObj["moduleTitle"] = RuleData[i].moduleTitle;
        DataObj["Private"] = RuleData[i].Private;
        DataObj["read"] = RuleData[i].read;
        DataObj["write"] = RuleData[i].write;
        DataObj["delete"] = RuleData[i].delete;
        await UpdateOne(
          "permission",
          {
            organizationId: new ObjectId(organizationId),
            moduleTitle: RuleData[i].moduleTitle,
          },
          DataObj
        );
      }
    }
    const obj = {
      res,
      msg: Constant.INFO_MSGS.SUCCESS,
      status: Constant.STATUS_CODE.OK,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

/**
 * Get Rule Permission
 */
const getRulePermission = async (req, res) => {
  const { logger } = req;
  try {
    const { organizationId } = req.decoded;
    let { sortBy, offset, limit } = req.body;

    matchCondition = {};
    let filterArray = req.body.search;
    if (filterArray) {
      matchCondition = await returnFilterByFieldQuery(logger, filterArray);
    }
    matchCondition.organizationId = new ObjectId(organizationId);

    if (sortBy === "recent") {
      sortBy = { createdTime: -1 };
    } else {
      sortBy = { createdTime: 1 };
    }
    offset = offset || 1;
    limit = limit || 10;
    const skip = limit * (offset - 1);

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
          let: { ownerId: "$PermissionsOwnerId" },
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
        $lookup: {
          let: { ownerId: "$ModifiedBy" },
          from: "users",
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$ownerId"] },
              },
            },
            { $project: { _id: 1, firstName: 1, lastName: 1 } },
          ],
          as: "ModifiedBy",
        },
      },
      {
        $unwind: {
          path: "$ModifiedBy",
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
    const permissionData = await Aggregation("permission", aggregationQuery);
    if (!permissionData[0].paginatedResult.length) {
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
        permissionData: permissionData[0].paginatedResult,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: permissionData[0].totalCount[0].count,
        },
      },
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

/**
 * get By id Rule Permission
 */
const getRulePermissionById = async (req, res) => {
  const { logger } = req;
  try {
    const { organizationId } = req.decoded;
    // const rulePermissionData = await Find("permission", { organizationId: new ObjectId(organizationId) });

    let aggregationQuery = [
      {
        $match: { organizationId: new ObjectId(organizationId) },
      },
      {
        $project: {
          _id: 0,
          moduleTitle: 1,
          Private: 1,
          read: 1,
          write: 1,
          delete: 1,
        },
      },
    ];
    const rulePermissionData = await Aggregation(
      "permission",
      aggregationQuery
    );

    if (!rulePermissionData) {
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
      data: rulePermissionData,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

module.exports = {
  createRulePermission,
  getRulePermission,
  getRulePermissionById,
};
