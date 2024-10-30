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
 * Create Macro
 * @param {Obj} req
 * @param {Obj} res
 * @returns {Obj}
 */
const createMacro = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;

    req.body.userId = new ObjectId(userId)
    req.body.organizationId = new ObjectId(organizationId)
    req.body.createdAt = new Date();
    req.body.updatedTime = new Date();
    if (req.body.emailTemplateId) {
      req.body.emailTemplateId = new ObjectId(req.body.emailTemplateId)
    }

    // Create Macro
    await InsertOne("macro", req.body);
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
 * Get Macro List
 * @param {} req
 * @param {*} res
 * @returns
 */
const getMacro = async (req, res) => {
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

    if (module) {
      matchCondition.module = module;
    }

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

    const macroData = await Aggregation("macro", aggregationQuery);
    if (!macroData[0].paginatedResult.length) {
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
        macroData: macroData[0].paginatedResult,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: macroData[0].totalCount[0].count,
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
 * Get Macro Details
 * @param {*} req
 * @param {*} res
 * @returns
 */
const getMacroDetails = async (req, res) => {
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

    const macroData = await Aggregation("macro", aggregationQuery);

    if (!macroData.length) {
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
      data: macroData,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

/**
 * Update Macro
 * @param {*} req
 * @param {*} res
 * @returns
 */
const updateMacro = async (req, res) => {
  const { logger } = req;
  try {
    const { id } = req.params;

    const macroData = await FindOne("macro", { _id: new ObjectId(id) });
    if (!macroData) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.INFO_MSGS.NO_DATA,
      };
      return Response.error(resp);
    }

    req.body.updatedTime = new Date();
    if (req.body.emailTemplateId) {
      req.body.emailTemplateId = new ObjectId(req.body.emailTemplateId)
    }

    await UpdateOne("macro", { _id: new ObjectId(id) }, req.body);

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
 * Delete macro
 * @param {*} req
 * @param {*} res
 * @returns
 */
const deleteMacro = async (req, res) => {
  const { logger } = req;
  try {
    const { id } = req.params;

    const macroData = await FindOne("macro", { _id: new ObjectId(id) });
    if (!macroData) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.INFO_MSGS.NO_DATA,
      };
      return Response.error(resp);
    }

    await PermanentDelete("macro", { _id: new ObjectId(id) });
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
 * Run Macro
 * @param {*} req
 * @param {*} res
 * @returns
 */
const runMacro = async (req, res) => {
  const { logger } = req;
  try {
    const { id } = req.params;
    const { organizationId } = req.decoded;

    // let matchCondition = { _id: new ObjectId(id) };
    let aggregationQuery = [
      {
        $match: { _id: new ObjectId(id) },
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

    const macroData = await Aggregation("macro", aggregationQuery);
    //console.log('macroData', macroData)
    // return
    if (!macroData.length) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.INFO_MSGS.NO_DATA,
      };
      return Response.error(resp);
    }

    const macroRunData = macroData[0];
    let runItems = [];

    const connections = req.body.connections.map((e) => new ObjectId(e));
    const queryCheckFieldValue = {};
    macroRunData.fieldUpdate.map((valueData) => {
      for (const [key, value] of Object.entries(valueData)) {
        queryCheckFieldValue[key] = value;
      }
    });
    //console.log(queryCheckFieldValue);
    if (macroRunData.module === "Leads") {
      await UpdateOne("leads", { _id: { $in: connections } }, queryCheckFieldValue);

      runItems = await Find("leads", {
        _id: {
          $in: connections,
        },
        ...queryCheckFieldValue,
      });

    } else if (macroRunData.module === "Contacts") {
      await UpdateOne("Contacts", { _id: { $in: connections } }, queryCheckFieldValue);
      runItems = await Find("contacts", {
        _id: { $in: connections },
        ...queryCheckFieldValue
      })

    } else if (macroRunData.module === "Opportunities") {
      await UpdateOne("Opportunities", { _id: { $in: connections } }, queryCheckFieldValue);
      runItems = await Find('deals', {
        _id: { $in: connections },
        ...queryCheckFieldValue
      })

    }
    if (runItems.length) {
      runItems.map(async (runValues) => {
        if (macroRunData.tasks && macroRunData.tasks.length) {
          const storeData = macroRunData.tasks.map((task) => {
            return {
              ...task,
              connectionId: new ObjectId(runValues._id),
              TasksOwnerId: new ObjectId(runValues.TasksOwnerId),
              organizationId: new ObjectId(organizationId),
            };
          });
          await Insert("tasks", storeData);
        }
        if (macroRunData.calls && macroRunData.calls.length) {
          const storeData = macroRunData.calls.map((call) => {
            return {
              ...call,
              connectionId: new ObjectId(runValues._id),
              CallsOwnerId: new ObjectId(runValues.CallsOwnerId),
              organizationId: new ObjectId(organizationId),
            };
          });
          await Insert("calls", storeData);
        }
        if (macroRunData.meetings && macroRunData.meetings.length) {
          const storeData = macroRunData.meetings.map((meeting) => {
            return {
              ...meeting,
              connectionId: new ObjectId(runValues._id),
              createdBy: new ObjectId(runValues.createdBy),
              organizationId: new ObjectId(organizationId),
            };
          });
          await Insert("meetings", storeData);
        }
        if (macroRunData.sitevisits && macroRunData.sitevisits.length) {
          const storeData = macroRunData.sitevisits.map((sitevisit) => {
            return {
              ...sitevisit,
              connectionId: new ObjectId(runValues._id),
              siteVisitOwnerId: new ObjectId(runValues.siteVisitOwnerId),
              organizationId: new ObjectId(organizationId),
            };
          });
          await Insert("sitevisits", storeData);
        }
      });
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

module.exports = {
  createMacro,
  getMacro,
  getMacroDetails,
  updateMacro,
  deleteMacro,
  runMacro,
};
