const { handleException } = require("../../../helpers/exception");
const Response = require("../../../helpers/response");
const Constant = require("../../../helpers/constant");
const {
  returnFilterByFieldQuery,
  returnFilterButton,
} = require("../../../utility/filter");
const { ObjectId } = require("mongodb");
const _ = require("underscore");
const {
  InsertOne,
  Aggregation,
  UpdateOne,
  FindOne,
  UpdateMany,
  DeleteMany,
  PermanentDelete
} = require("../../../library/methods");

/**
 * Create Case Escalation
 */
const createCaseEscalation = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    const { Active } = req.body;
    if (Active === true) {
      await UpdateOne("caseescalation", { Active: true }, { Active: false });
    }
    req.body.CaseEscalationOwnerId = new ObjectId(userId);
    req.body.organizationId = new ObjectId(organizationId);
    req.body.createdTime = new Date();
    req.body.updatedTime = new Date();

    // Create Case Escalation
    await InsertOne("caseescalation", req.body);
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
 * Get Case Escalation
 */
const getCaseEscalation = async (req, res) => {
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
          let: { ownerId: "$CaseEscalationOwnerId" },
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

    const CaseEscalationData = await Aggregation(
      "caseescalation",
      aggregationQuery
    );
    if (!CaseEscalationData[0].paginatedResult.length) {
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
        CaseEscalationData: CaseEscalationData[0].paginatedResult,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: CaseEscalationData[0].totalCount[0].count,
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
 * get By id Case Escalation
 */
const getCaseEscalationById = async (req, res) => {
  const { logger } = req;
  try {
    const { id } = req.params;
    // get Case Escalation
    const CaseEscalationData = await FindOne("caseescalation", {
      _id: new ObjectId(id),
    });

    if (!CaseEscalationData) {
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
      data: CaseEscalationData,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

/**
 * Update Case Escalation
 */
const updateCaseEscalation = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    const { Active } = req.body;
    const { id } = req.params;
    req.body.ModifiedBy = new ObjectId(userId);
    req.body.organizationId = new ObjectId(organizationId);
    req.body.updatedTime = new Date();

    if (Active === true) {
      await UpdateOne("caseescalation", { Active: true }, { Active: false });
    }
    // update caseescalation
    await UpdateOne("caseescalation", { _id: new ObjectId(id) }, req.body);
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
 * Case Escalation Get Filter Field
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
          from: "caseescalation",
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
    const CaseEscalationData = await Aggregation(
      "caseescalation",
      aggregationQuery
    );
    if (!CaseEscalationData) {
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
      data: Object.keys(CaseEscalationData[0].FieldsData),
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

/**
 * Delete Case Escalation
 */
const deleteCaseEscalation = async (req, res) => {
  const { logger } = req;
  try {
    const { id } = req.params;
    await PermanentDelete("caseescalation", { _id: new ObjectId(id) });
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
  createCaseEscalation,
  getCaseEscalation,
  getCaseEscalationById,
  updateCaseEscalation,
  getFilterField,
  deleteCaseEscalation
};
