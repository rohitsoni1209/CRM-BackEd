const { handleException } = require("../../../helpers/exception");
const Response = require("../../../helpers/response");
const Constant = require("../../../helpers/constant");
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
  Count,
  PermanentDelete,
} = require("../../../library/methods");

/**
 * Create CustomizeDashboard
 * @param {Obj} req
 * @param {Obj} res
 * @returns {Obj}
 */
const createCustomizeDashboard = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;

    req.body.userId = new ObjectId(userId);
    req.body.organizationId = new ObjectId(organizationId);
    req.body.createdAt = new Date();
    req.body.updatedTime = new Date();
    if (req.body.roles.length) {
      req.body.roles = req.body.roles.map((e) => new ObjectId(e));
    }

    // Create CustomizeDashboard
    await InsertOne("customizeDashboard", req.body);
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

const createCustomizeDashboardcustome = async (userId, organizationId) => {
  const { logger } = req;
  try {
    //const { userId, organizationId } = req.req;
    const userId = userId;
    const organizationId = organizationId;

    req.body.userId = new ObjectId(userId);
    req.body.organizationId = new ObjectId(organizationId);
    req.body.createdAt = new Date();
    req.body.updatedTime = new Date();
    if (req.body.roles.length) {
      req.body.roles = req.body.roles.map((e) => new ObjectId(e));
    }

    // Create CustomizeDashboard
    await InsertOne("customizeDashboard", req.body);
    const obj = {
      res,
      msg: Constant.INFO_MSGS.CREATED_SUCCESSFULLY,
      status: Constant.STATUS_CODE.OK,
    };
    return obj;
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

/**
 * Get CustomizeDashboard List
 * @param {} req
 * @param {*} res
 * @returns
 */
const getCustomizeDashboard = async (req, res) => {
  const { logger } = req;
  try {
    const { organizationId } = req.decoded;
    let { module, offset, limit } = req.query;

    let queryObj = req.query;
    delete queryObj.offset;
    delete queryObj.sortBy;
    delete queryObj.limit;
    let queryObjKeys = Object.keys(queryObj);

    let orCondition = [];
    for (let key of queryObjKeys) {
      orCondition.push({ [key]: { $regex: queryObj[key], $options: "i" } });
    }

    offset = offset || 1;
    limit = limit || 10;
    const skip = limit * (offset - 1);
    let matchCondition = {
      organizationId: new ObjectId(organizationId),
    };

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
        $facet: {
          paginatedResult: [{ $skip: skip }, { $limit: parseInt(limit) }],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const CustomizeDashboardData = await Aggregation(
      "customizeDashboard",
      aggregationQuery
    );
    if (!CustomizeDashboardData[0].paginatedResult.length) {
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
        CustomizeDashboardData: CustomizeDashboardData[0].paginatedResult,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: CustomizeDashboardData[0].totalCount[0].count,
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
 * Get CustomizeDashboard Details
 * @param {*} req
 * @param {*} res
 * @returns
 */
const getCustomizeDashboardDetails = async (req, res) => {
  const { logger } = req;
  try {
    const { id } = req.params;

    let matchCondition = { _id: new ObjectId(id) };
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
    ];

    const CustomizeDashboardData = await Aggregation(
      "customizeDashboard",
      aggregationQuery
    );

    if (!CustomizeDashboardData.length) {
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
      data: CustomizeDashboardData,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

/**
 * Update CustomizeDashboard
 * @param {*} req
 * @param {*} res
 * @returns
 */
const updateCustomizeDashboard = async (req, res) => {
  const { logger } = req;
  try {
    const { id } = req.params;

    const CustomizeDashboardData = await FindOne("customizeDashboard", {
      _id: new ObjectId(id),
    });
    if (!CustomizeDashboardData) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.INFO_MSGS.NO_DATA,
      };
      return Response.error(resp);
    }

    req.body.updatedTime = new Date();
    if (req.body.roles.length) {
      req.body.roles = req.body.roles.map((e) => new ObjectId(e));
    }

    await UpdateOne("customizeDashboard", { _id: new ObjectId(id) }, req.body);

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
 * Delete CustomizeDashboard
 * @param {*} req
 * @param {*} res
 * @returns
 */
const deleteCustomizeDashboard = async (req, res) => {
  const { logger } = req;
  try {
    const { id } = req.params;

    const CustomizeDashboardData = await FindOne("customizeDashboard", {
      _id: new ObjectId(id),
    });
    if (!CustomizeDashboardData) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.INFO_MSGS.NO_DATA,
      };
      return Response.error(resp);
    }

    await PermanentDelete("customizeDashboard", { _id: new ObjectId(id) });
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
  createCustomizeDashboard,
  getCustomizeDashboard,
  createCustomizeDashboardcustome,
  getCustomizeDashboardDetails,
  updateCustomizeDashboard,
  deleteCustomizeDashboard,
};
