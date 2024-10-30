const { handleException } = require("../../helpers/exception");
const Response = require("../../helpers/response");
const Constant = require("../../helpers/constant");
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
} = require("../../library/methods");

/**
 * Create Territories
 * @param {Obj} req
 * @param {Obj} res
 * @returns {Obj}
 */
const createTerritories = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;

    req.body.userId = new ObjectId(userId)
    req.body.organizationId = new ObjectId(organizationId)
    req.body.createdAt = new Date();
    req.body.updatedTime = new Date();
    if (req.body.manager) {
      req.body.manager = new ObjectId(req.body.manager)
    }
    if (req.body.patentTerritory) {
      req.body.patentTerritory = new ObjectId(req.body.patentTerritory)
    }

    if (req.body?.users?.length > 0) {
      req.body.users = req.body.users.map(e => { return new ObjectId(e) })
    }

    // Create Territories
    await InsertOne("territories", req.body);
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
 * Get Territories List
 * @param {} req
 * @param {*} res
 * @returns
 */
const getTerritories = async (req, res) => {
  const { logger } = req;
  try {
    const { organizationId } = req.decoded;
    let { offset, limit } = req.query;

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

    const TerritoriesData = await Aggregation("territories", aggregationQuery);
    if (!TerritoriesData[0].paginatedResult.length) {
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
        TerritoriesData: TerritoriesData[0].paginatedResult,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: TerritoriesData[0].totalCount[0].count,
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
 * Get Territories Details
 * @param {*} req
 * @param {*} res
 * @returns
 */
const getTerritoriesDetails = async (req, res) => {
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

    const TerritoriesData = await Aggregation("territories", aggregationQuery);

    if (!TerritoriesData.length) {
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
      data: TerritoriesData,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

/**
 * Update Territories
 * @param {*} req
 * @param {*} res
 * @returns
 */
const updateTerritories = async (req, res) => {
  const { logger } = req;
  try {
    const { id } = req.params;

    const TerritoriesData = await FindOne("territories", { _id: new ObjectId(id) });
    if (!TerritoriesData) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.INFO_MSGS.NO_DATA,
      };
      return Response.error(resp);
    }

    req.body.updatedTime = new Date();
    if (req.body.manager) {
      req.body.manager = new ObjectId(req.body.manager)
    }
    if (req.body.patentTerritory) {
      req.body.patentTerritory = new ObjectId(req.body.patentTerritory)
    }

    if (req.body?.users?.length > 0) {
      req.body.users = req.body.users.map(e => { return new ObjectId(e) })
    }

    await UpdateOne("territories", { _id: new ObjectId(id) }, req.body);

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
 * Delete Territories
 * @param {*} req
 * @param {*} res
 * @returns
 */
const deleteTerritories = async (req, res) => {
  const { logger } = req;
  try {
    const { id } = req.params;

    const TerritoriesData = await FindOne("territories", { _id: new ObjectId(id) });
    if (!TerritoriesData) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.INFO_MSGS.NO_DATA,
      };
      return Response.error(resp);
    }

    await PermanentDelete("territories", { _id: new ObjectId(id) });
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

/**
 * Run Territories
 * @param {*} req
 * @param {*} res
 * @returns
 */
const runTerritories = async (req, res) => {
  const { logger } = req;
  try {
    const { id } = req.params;
    const { organizationId } = req.decoded;

    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

module.exports = {
  createTerritories,
  getTerritories,
  getTerritoriesDetails,
  updateTerritories,
  deleteTerritories,
  runTerritories,
};
