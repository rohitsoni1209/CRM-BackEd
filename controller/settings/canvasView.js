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
 * Create CanvasView
 */
const AddCanvasView = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;

    req.body.canvasViewsOwnerId = new ObjectId(userId);
    req.body.organizationId = new ObjectId(organizationId);
    req.body.createdTime = new Date();
    req.body.updatedTime = new Date();

    const canvasviewInfo = await FindOne("canvasview", {
      moduleTitle: req.body.moduleTitle,
      organizationId,
    });
    if (canvasviewInfo) {
      await UpdateOne(
        "canvasview",
        { _id: new ObjectId(canvasviewInfo._id) },
        req.body
      );
      const obj = {
        res,
        msg: Constant.INFO_MSGS.SUCCESS,
        status: Constant.STATUS_CODE.OK,
      };
      return Response.success(obj);
    }

    // Create CanvasView
    await InsertOne("canvasview", req.body);

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
 * Get Canvas View
 */
const GetCanvasView = async (req, res) => {
  const { logger } = req;
  try {
    const { organizationId, userId } = req.decoded;
    let { sortBy, offset, limit, str, moduleTitle } = req.query;

    let queryObj = req.query;
    delete queryObj.offset;
    delete queryObj.sortBy;
    delete queryObj.limit;
    delete queryObj.moduleTitle;
    delete queryObj.str;
    let queryObjKeys = Object.keys(queryObj);
    const orCondition = [];

    for (let key of queryObjKeys) {
      orCondition.push({ [key]: queryObj[key] });
    }
    // if (_.isUndefined(query)) query = '';
    if (sortBy === "recent") {
      sortBy = { createdTime: -1 };
    } else {
      sortBy = { createdTime: 1 };
    }
    offset = offset || 1;
    limit = limit || 10;
    const skip = limit * (offset - 1);
    let matchCondition = {};

    if (moduleTitle) {
      // console.log("moduleTitle",moduleTitle)
      orCondition.push({ moduleTitle: { $regex: moduleTitle, $options: "i" } });
    }
    matchCondition.organizationId = new ObjectId(organizationId);
    // //console.log("orCondition",orCondition)
    if (orCondition.length) {
      matchCondition = { ...matchCondition, $or: orCondition };
    }
    // //console.log("matchCondition",matchCondition)
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
          let: { ownerId: "$canvasViewsOwnerId" },
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
    const canvasviewData = await Aggregation("canvasview", aggregationQuery);
    if (!canvasviewData[0].paginatedResult.length) {
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
        canvasviewData: canvasviewData[0].paginatedResult,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: canvasviewData[0].totalCount[0].count,
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
 * get By id CanvasView
 */
const getCanvasViewById = async (req, res) => {
  const { logger } = req;
  try {
    const { id } = req.params;

    const canvasviewData = await FindOne("canvasview", {
      _id: new ObjectId(id),
    });

    if (!canvasviewData) {
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
      data: canvasviewData,
    };
    return Response.success(obj);
  } catch (error) {
    console.log("error", error);
    return handleException(logger, res, error);
  }
};

/**
 * Update CanvasView
 */
const UpdateCanvasView = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    const { id } = req.params;
    const { moduleTitle } = req.body;
    const existData = await FindOne("canvasview", {
      moduleTitle,
      organizationId: new ObjectId(organizationId),
    });
    if (existData) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: "moduleTitle already exists",
      };
      return Response.error(resp);
    }
    req.body.ModifiedBy = new ObjectId(userId);
    req.body.organizationId = new ObjectId(organizationId);
    req.body.updatedTime = new Date();

    await UpdateOne("canvasview", { _id: new ObjectId(id) }, req.body);
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

module.exports = {
  AddCanvasView,
  GetCanvasView,
  UpdateCanvasView,
  getCanvasViewById,
};
