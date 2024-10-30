const bcrypt = require("bcrypt");
const { handleException } = require("../../helpers/exception");
const Response = require("../../helpers/response");
const Constant = require("../../helpers/constant");
const {
  returnFilterByFieldQuery,
  returnFilterButton,
} = require("../../utility/filter");
const { dataSharing } = require("../../utility/dataSharing");
const deleteAllRecord = require("../../utility/deleteAllRecord");
const { ProcessApprove } = require("../../utility/processApprov");
const ProfileValidation = require("../../helpers/joi-validation");
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
  UpdateMany,
  PermanentDelete,
  DeleteMany,
} = require("../../library/methods");
const { getOnlyTypeFileKeys } = require("../settings/formController");
/**
 * Create Deal
 */
const createDeal = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    let IdRegExp = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i;
    let ownerIdTest = IdRegExp.test(req.body.OpportunitiesOwnerId);

    if (!req.body.OpportunitiesOwnerId) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: "Please Add Key-Value Pair Of OpportunitiesOwnerId",
      };
      return Response.error(resp);
    }
    if (ownerIdTest == false) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: "Not Valid OpportunitiesOwnerId",
      };
      return Response.error(resp);
    }
    req.body.OpportunitiesOwnerId = new ObjectId(req.body.OpportunitiesOwnerId);
    req.body.organizationId = new ObjectId(organizationId);
    req.body.CreatedBy = new ObjectId(userId);
    req.body.createdTime = new Date();
    req.body.updatedTime = null;
    // req.body.ChannelPartnerName = req.body?.ChannelPartnerName ? new ObjectId(req.body?.ChannelPartnerName) : null;

    req.body.ChannelPartnerName = ObjectId.isValid(req.body?.ChannelPartnerName) ? new ObjectId(req.body?.ChannelPartnerName) : req.body?.ChannelPartnerName;

    req.body.Pipeline = new ObjectId(req.body.Pipeline);
    req.body.Stage = new ObjectId(req.body.Stage);

    req.body.AccountName = ObjectId.isValid(req.body?.AccountName) ? new ObjectId(req.body?.AccountName) : req.body?.AccountName;
    req.body.ContactName = ObjectId.isValid(req.body?.ContactName) ? new ObjectId(req.body?.ContactName) : req.body?.ContactName;

    // Create deals
    await InsertOne("deals", req.body);
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
 * Get Deal
 */
const getDeal = async (req, res) => {
  const { logger } = req;
  try {
    const { organizationId, userId, role } = req.decoded;
    let { sortBy, offset, limit, profile, mass = false } = req.body;

    matchCondition = {};
    let filterArray = req.body.search;
    if (filterArray) {
      matchCondition = await returnFilterByFieldQuery(logger, filterArray);
    }
    let filterbutton = req.body.buttonType;
    // if (_.isUndefined(filterbutton) || filterbutton != "All") {
    if (filterbutton != "All") {
      matchCondition = await returnFilterButton(logger, filterbutton, userId);
    }
    matchCondition.organizationId = new ObjectId(organizationId);

    if (profile != "Administrator") {
      // matchCondition.OpportunitiesOwnerId = new ObjectId(userId);
      matchCondition = await dataSharing(req, 'opportunities', 'OpportunitiesOwnerId', mass);
    }
    if (role !== "CEO") {
      matchCondition["OpportunitiesOwnerId"] = new ObjectId(userId);
    }
    // if (_.isUndefined(query)) query = '';
    if (sortBy === "recent") {
      sortBy = { createdTime: 1 };
    } else {
      sortBy = { createdTime: -1 };
    }
    offset = offset || 1;
    limit = limit || 10;
    const skip = limit * (offset - 1);
    //console.log("matchCondition===>", JSON.stringify(matchCondition));

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
          let: { ownerId: "$OpportunitiesOwnerId" },
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
        $lookup: {
          from: "tasks",
          localField: "_id",
          foreignField: "connectionId",
          as: "tasksData",
        },
      },
      {
        $lookup: {
          from: "contacts",
          localField: "ContactName",
          foreignField: "_id",
          as: "ContactData",
        },
      },
      {
        $lookup: {
          from: "accounts",
          localField: "AccountName",
          foreignField: "_id",
          as: "AccountData",
        },
      },
      // {
      //   $lookup: {
      //     from: "pipeline",
      //     localField: "_id",
      //     foreignField: "Pipeline",
      //     as: "pipelineData",
      //   },
      // },
      // {
      //   $unwind: {
      //     path: "$tasksData",
      //     preserveNullAndEmptyArrays: true,
      //   },
      // },
      {
        $lookup: {
          from: "calls",
          localField: "_id",
          foreignField: "connectionId",
          as: "callsData",
        },
      },
      // {
      //   $unwind: {
      //     path: "$callsData",
      //     preserveNullAndEmptyArrays: true,
      //   },
      // },
      {
        $lookup: {
          from: "pipeline",
          localField: "Pipeline",
          foreignField: "_id",
          as: "pipelineData",
        },
      },
      {
        $unwind: {
          path: "$pipelineData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "stage",
          localField: "Stage",
          foreignField: "_id",
          as: "stageData",
        },
      },
      {
        $unwind: {
          path: "$stageData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "channelPartner",
          localField: "ChannelPartnerName",
          foreignField: "_id",
          as: "channelPartnerData",
        },
      },
      {
        $unwind: {
          path: "$channelPartnerData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $sort: sortBy,
      },
      {
        $facet: {
          paginatedResult: [{ $skip: skip }, { $limit: parseInt(limit) }],
          totalCount: [{ $count: "count" }],
        },
      },
    ];
    console.log("aggregationQuery===>", JSON.stringify(aggregationQuery));
    const DealData = await Aggregation("deals", aggregationQuery);
    if (!DealData[0].paginatedResult.length) {
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
        DealData: DealData[0].paginatedResult,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: DealData[0].totalCount[0].count,
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
 * get By id Deal
 */
const getDealById = async (req, res) => {
  const { logger } = req;
  try {
    const { id } = req.params;
    const { userId, organizationId } = req.decoded;
    req.body.AccountsOwnerId = new ObjectId(req.body.AccountsOwnerId);
    req.body.organizationId = new ObjectId(organizationId);
    // Create deals
    const infoData = await FindOne("deals", { _id: new ObjectId(id) });

    if (!infoData) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.INFO_MSGS.NO_DATA,
      };
      return Response.error(resp);
    }
    await UpdateOne(
      "deals",
      { _id: new ObjectId(id) },
      { read: true, tuch: true }
    );
    const obj = {
      res,
      msg: Constant.INFO_MSGS.SUCCESS,
      status: Constant.STATUS_CODE.OK,
      data: infoData,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

/**
 * Update Deal
 */
const updateDeal = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    const { id } = req.params;
    req.body.ModifiedBy = new ObjectId(userId);
    req.body.organizationId = new ObjectId(organizationId);
    req.body.updatedTime = new Date();
    req.body.ContactName = ObjectId.isValid(req.body?.ContactName) ? new ObjectId(req.body?.ContactName) : req.body?.ContactName;
    req.body.AccountName = ObjectId.isValid(req.body?.AccountName) ? new ObjectId(req.body?.AccountName) : req.body?.AccountName;
    //  req.body.ChannelPartnerName = req.body?.ChannelPartnerName ? new ObjectId(req.body?.ChannelPartnerName) : null;
    req.body.ChannelPartnerName = ObjectId.isValid(req.body?.ChannelPartnerName) ? new ObjectId(req.body?.ChannelPartnerName) : req.body?.ChannelPartnerName;

    req.body.OpportunitiesOwnerId = req.body?.OpportunitiesOwnerId ? new ObjectId(req.body.OpportunitiesOwnerId) : null;
    if (req.body.stage) {
      req.body.stage = new ObjectId(req.body.stage);
    }

    const dealsData = await FindOne("deals", { _id: new ObjectId(id) });
    if (dealsData?.ApprovalStatus != "reject" || "approve") {
      const payload = {
        collection: "deals",
        id,
        userId,
        organizationId,
        BodyData: req.body,
        reqMethod: req.method,
      };
      await ProcessApprove(logger, payload);
    }

    await UpdateOne("deals", { _id: new ObjectId(id) }, req.body);
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
    const fileTypeField = await getOnlyTypeFileKeys("Opportunities", organizationId)
    let aggregationQuery = [
      {
        $match: { organizationId: new ObjectId(organizationId) },
      },
      { $project: { numFields: { $size: { $objectToArray: "$$ROOT" } } } },
      { $sort: { numFields: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: "deals",
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
    const fieldData = await Aggregation("deals", aggregationQuery);
    if (fieldData.length == 0) {
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
      data: Object.keys(fieldData[0].FieldsData).filter(item => !fileTypeField.includes(item)),
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

/**
 * Mass Transfer
 */
const massTransfer = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    const { fromUser, toUserm, dataList } = req.body;

    // return
    var pinArr = [];
    for (let i = 0; i < req.body.dataList.length; i++) {
      pinArr.push(new ObjectId(req.body.dataList[i]));
    }

    const listData = await UpdateMany(
      "deals",
      { _id: { $in: pinArr }, organizationId: new ObjectId(organizationId) },
      { OpportunitiesOwnerId: new ObjectId(toUserm) }
    );

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

const massDelete = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    const { dataList } = req.body;
    // return
    var payload = [];
    for (let i = 0; i < req.body.dataList.length; i++) {
      payload.push(new ObjectId(req.body.dataList[i]));
    }
    const listData = await DeleteMany("deals", {
      _id: { $in: payload },
      organizationId: new ObjectId(organizationId),
    });
    deleteAllRecord.massDeleteAll(logger, payload);

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

const massUpdate = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    const { dataList } = req.body;
    // return
    var payload = [];
    for (let i = 0; i < req.body.dataList.length; i++) {
      payload.push(new ObjectId(req.body.dataList[i]));
    }
    let setPayload = req.body.data;

    const listData = await UpdateMany(
      "deals",
      { _id: { $in: payload }, organizationId: new ObjectId(organizationId) },
      setPayload
    );

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
 * Add Excel Deal Data
 */
const addDealExcel = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;

    let IdRegExp = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i;
    var listArr = [];

    for (let i = 0; i < req.body.length; i++) {
      var ResObj = {};

      // const OpportunitiesOwnerId = req.body[i].OpportunitiesOwnerId;
      // let ownerIdTest = IdRegExp.test(OpportunitiesOwnerId);

      // if (_.isUndefined(OpportunitiesOwnerId) || ownerIdTest == false) {
      //   // //console.log(`Enter if ${i+1}`)
      //   ResObj["raw"] = i + 1;
      //   ResObj["error"] = true;
      //   ResObj["Message"] = "Please Enter OpportunitiesOwnerId";
      //   ResObj["data"] = req.body[i];
      //   listArr.push(ResObj);
      //   continue;
      // } else {
      // //console.log(`Enter else ${i+1}`)
      ResObj["raw"] = i + 1;
      ResObj["error"] = false;
      ResObj["Message"] = "Created successfully";
      ResObj["data"] = req.body[i];
      listArr.push(ResObj);

      req.body[i].OpportunitiesOwnerId = new ObjectId(userId);
      req.body[i].organizationId = new ObjectId(organizationId);
      req.body[i].createdTime = new Date();
      req.body[i].updatedTime = null;
      // Create deals
      await InsertOne("deals", req.body[i]);
      // }
    }
    const obj = {
      res,
      msg: Constant.INFO_MSGS.SUCCESS,
      status: Constant.STATUS_CODE.OK,
      data: listArr,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

/**
 * Create Inventory
 */
const createDealInventory = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    req.body.DealInventoryOwnerId = new ObjectId(userId);
    req.body.DealId = new ObjectId(req.body.DealId);
    req.body.organizationId = new ObjectId(organizationId);
    req.body.createdTime = new Date();
    req.body.updatedTime = null;
    await DeleteMany("dealInventory", { DealId: new ObjectId(req.body.DealId) });
    // Create Deal Inventory
    await InsertOne("dealInventory", req.body);
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
 * DealInventory get By DealId
 */
const getDealInventory = async (req, res) => {
  const { logger } = req;
  try {
    const { DealId } = req.params;
    const { userId, organizationId } = req.decoded;
    // Create deals
    const infoData = await FindOne("dealInventory", {
      DealId: new ObjectId(DealId),
      organizationId: new ObjectId(organizationId),
      DealInventoryOwnerId: new ObjectId(userId),
    });

    if (!infoData) {
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
      data: infoData,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

module.exports = {
  createDeal,
  getDeal,
  getDealById,
  updateDeal,
  getFilterField,
  massTransfer,
  massDelete,
  massUpdate,
  addDealExcel,
  createDealInventory,
  getDealInventory,
};
