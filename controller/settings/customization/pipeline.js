const { handleException } = require("../../../helpers/exception");
const Response = require("../../../helpers/response");
const Constant = require("../../../helpers/constant");
const {
  returnFilterByFieldQuery,
  returnFilterButton,
} = require("../../../utility/filter");
const deleteAllRecord = require("../../../utility/deleteAllRecord");
const { ObjectId } = require("mongodb");
const _ = require("underscore");
const {
  InsertOne,
  Aggregation,
  UpdateOne,
  FindOne,
  UpdateMany,
  DeleteMany,
  PermanentDelete,
} = require("../../../library/methods");

/**
 * Create Pipeline
 */
const createPipeline = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    const { stages, Default } = req.body;
    if (Default === true) {
      await UpdateOne(
        "pipeline",
        { Default: true, organizationId: new ObjectId(organizationId) },
        { Default: false }
      );
    }
    req.body.PipelineOwnerId = new ObjectId(userId);
    req.body.organizationId = new ObjectId(organizationId);
    req.body.createdTime = new Date();
    req.body.updatedTime = new Date();
    // req.body.stages = stages.map((e) => (e = new ObjectId(e)));

    // Create Pipeline
    await InsertOne("pipeline", req.body);
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
 * Get Pipeline
 */
const getPipeline = async (req, res) => {
  const { logger } = req;
  try {
    const { organizationId, userId } = req.decoded;
    let { sortBy, offset, limit } = req.body;

    matchCondition = {};
    let filterArray = req.body.search;
    if (filterArray) {
      matchCondition = await returnFilterByFieldQuery(logger, filterArray);
    }

    let filterbutton = req.body.buttonType;
    // if (_.isUndefined(filterbutton) || filterbutton != "All") {
    if (filterbutton) {
      matchCondition = await returnFilterButton(logger, filterbutton, userId);
    } else {
      matchCondition["status"] = { $ne: 0 };
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

    //console.log("matchCondition", matchCondition);

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
          let: { ownerId: "$PipelineOwnerId" },
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
      // {
      //   $lookup: {
      //     from: "stage",
      //     localField: "stages",
      //     foreignField: "_id",
      //     as: "stageData",
      //   },
      // },
      // {
      //   $unwind: {
      //     path: "$stageData",
      //     preserveNullAndEmptyArrays: true,
      //   },
      // },
      // {
      //   $group: {
      //     _id: "$_id",
      //     pipelineTitle: { $first: "$pipelineTitle" },
      //     Layout: { $first: "$Layout" },
      //     Default: { $first: "$Default" },
      //     organizationData: { $first: "$organizationData" },
      //     ownerData: { $first: "$ownerData" },
      //     stagesData: {
      //       $push: "$stageData"
      //     },
      //   },
      // },
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

    const pipelineData = await Aggregation("pipeline", aggregationQuery);
    if (!pipelineData[0].paginatedResult.length) {
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
        pipelineData: pipelineData[0].paginatedResult,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: pipelineData[0].totalCount[0].count,
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
 * get By id Pipeline
 */
const getPipelineById = async (req, res) => {
  const { logger } = req;
  try {
    const { id } = req.params;
    // get pipeline
    const pipelineData = await FindOne("pipeline", { _id: new ObjectId(id) });

    if (!pipelineData) {
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
      data: pipelineData,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

/**
 * Update Pipeline
 */
const updatePipeline = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    const { stages, Default } = req.body;
    const { id } = req.params;
    req.body.ModifiedBy = new ObjectId(userId);
    req.body.organizationId = new ObjectId(organizationId);
    req.body.updatedTime = new Date();
    // if(req.body.stages){
    //   req.body.stages = stages.map((e) => (e = new ObjectId(e)));
    // }

    if (Default === true) {
      await UpdateOne(
        "pipeline",
        { Default: true, organizationId: new ObjectId(organizationId) },
        { Default: false }
      );
    }
    // update pipeline
    await UpdateOne("pipeline", { _id: new ObjectId(id) }, req.body);
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
 * Get Filter Field
 */
const getFilterField = async (req, res) => {
  const { logger } = req;
  try {
    const { organizationId, userId } = req.decoded;

    let aggregationQuery = [
      {
        $match: { organizationId: new ObjectId(organizationId) },
      },
      { $project: { numFields: { $size: { $objectToArray: "$$ROOT" } } } },
      { $sort: { numFields: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: "pipeline",
          localField: "_id",
          foreignField: "_id",
          as: "FieldsData",
        },
      },
      {
        $unwind: {
          path: "$FieldsData",
          preserveNullAndEmptyArrays: false,
        },
      },
    ];
    const pipelineData = await Aggregation("pipeline", aggregationQuery);
    if (!pipelineData) {
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
      data: Object.keys(pipelineData[0].FieldsData),
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

// --------------- PIPELINE STAGES API'S ---------------------

/**
 * Create Stage
 */
const createStage = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    req.body.StageOwnerId = new ObjectId(userId);
    req.body.organizationId = new ObjectId(organizationId);
    req.body.createdTime = new Date();
    req.body.updatedTime = new Date();

    // Create Stage
    await InsertOne("stage", req.body);
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
 * Get Stage
 */
const getStage = async (req, res) => {
  const { logger } = req;
  try {
    const { organizationId, userId } = req.decoded;
    let { sortBy, offset, limit } = req.body;

    matchCondition = {};
    let filterArray = req.body.search;
    if (filterArray) {
      matchCondition = await returnFilterByFieldQuery(logger, filterArray);
    }

    let filterbutton = req.body.buttonType;
    // if (_.isUndefined(filterbutton) || filterbutton != "All") {
    if (filterbutton) {
      matchCondition = await returnFilterButton(logger, filterbutton, userId);
    } else {
      matchCondition["status"] = { $ne: 0 };
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
          let: { ownerId: "$StageOwnerId" },
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

    const pipelineData = await Aggregation("stage", aggregationQuery);
    if (!pipelineData[0].paginatedResult.length) {
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
        pipelineData: pipelineData[0].paginatedResult,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: pipelineData[0].totalCount[0].count,
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
 * Delete Approval Process
 */
const deletePipeline = async (req, res) => {
  const { logger } = req;
  try {
    const { id } = req.params;
    await PermanentDelete("pipeline", { _id: new ObjectId(id) });
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
  createPipeline,
  getPipeline,
  getPipelineById,
  updatePipeline,
  getFilterField,
  createStage,
  getStage,
  deletePipeline,
};
