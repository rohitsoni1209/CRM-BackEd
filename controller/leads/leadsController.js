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
 * Create Leads
 */
const createLeads = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    let IdRegExp = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i;
    let ownerIdTest = IdRegExp.test(req.body.LeadsOwnerId);

    if (!req.body.LeadsOwnerId) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: "Please Add Key-Value Pair Of LeadsOwnerId",
      };
      return Response.error(resp);
    }
    if (ownerIdTest == false) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: "Not Valid LeadsOwnerId",
      };
      return Response.error(resp);
    }
    req.body.LeadsOwnerId = new ObjectId(req.body.LeadsOwnerId);
    req.body.CreatedBy = new ObjectId(userId);
    req.body.organizationId = new ObjectId(organizationId);
    // req.body.ChannelPartnerName =req.body?.ChannelPartnerName ?  new ObjectId(req.body?.ChannelPartnerName) :null;
    req.body.ChannelPartnerName = ObjectId.isValid(req.body?.ChannelPartnerName) ? new ObjectId(req.body?.ChannelPartnerName) : req.body?.ChannelPartnerName;

    req.body.createdTime = new Date();
    req.body.updatedTime = null;

    // For Leads Create Under Any Connection
    if (req.body.connectionId) {
      req.body.connectionId = new ObjectId(req.body.connectionId);
    } else {
      req.body.connectionId = null;
    }
    // Create Lead
    await InsertOne("leads", req.body);
    const obj = {
      res,
      msg: Constant.INFO_MSGS.CREATED_SUCCESSFULLY,
      status: Constant.STATUS_CODE.OK,
      // data: userDetails,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

/**
 * Get Leads
 */
const getLeads = async (req, res) => {
  const { logger } = req;
  try {
    const { organizationId, userId, role } = req.decoded;
    let { sortBy, offset, limit, profile, mass = false } = req.body;
    // console.log('Hello', req.decoded)
    matchCondition = {};
    let filterArray = req.body.search;
    if (filterArray) {
      matchCondition = await returnFilterByFieldQuery(logger, filterArray);
    }

    let filterbutton = req.body.buttonType;
    // if (_.isUndefined(filterbutton) || filterbutton != "All") {
    if (filterbutton != "All") {
      matchCondition = await returnFilterButton(logger, filterbutton, userId);
    } else {
      matchCondition["status"] = { $ne: 0 };
    }

    if (profile != "Administrator") {
      matchCondition = await dataSharing(req, "Leads", "LeadsOwnerId", mass);
      // matchCondition.LeadsOwnerId = new ObjectId(userId);
    }
    if (role !== "CEO") {
      matchCondition["LeadsOwnerId"] = new ObjectId(userId);
    }
    // //console.log('matchCondition',matchCondition)
    // //console.log('matchCondition', matchCondition)
    // if (_.isUndefined(query)) query = '';
    if (sortBy === "recent") {
      sortBy = { createdTime: 1 };
    } else {
      sortBy = { createdTime: -1 };
    }
    offset = offset || 1;
    limit = limit || 10;
    const skip = limit * (offset - 1);

    matchCondition.organizationId = new ObjectId(organizationId);
    //console.log(JSON.stringify(matchCondition, null, 4)+'match condition ---->>>')
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
          let: { ownerId: "$LeadsOwnerId" },
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
          as: "Modified_By",
        },
      },
      {
        $unwind: {
          path: "$Modified_By",
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
    // console.log("aggregationQuery=====>", JSON.stringify(aggregationQuery));
    const leadsData = await Aggregation("leads", aggregationQuery);
    //console.log(JSON.stringify(leadsData)+'leadsdata response');
    if (!leadsData[0].paginatedResult.length) {
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
        leadsData: leadsData[0].paginatedResult,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: leadsData[0].totalCount[0].count,
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
 * get By id Leads
 */
const getleadsById = async (req, res) => {
  const { logger } = req;
  try {
    const { id } = req.params;
    const { userId, organizationId } = req.decoded;
    //console.log("id && userId && organizationId", id, "<=>", userId, "<=>", organizationId);
    let _id = "";
    if (id && id.includes("&ownerName")) {
      let newKey = id.split("&");
      _id = newKey[0];
    } else {
      _id = id;
    }

    // get Lead
    const infoData = await FindOne("leads", { _id: new ObjectId(_id) });

    if (!infoData) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.INFO_MSGS.NO_DATA,
      };
      return Response.error(resp);
    }
    await UpdateOne(
      "leads",
      { _id: new ObjectId(_id) },
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
 * Update Leads
 */
const updateLeads = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    const { id } = req.params;
    req.body.ModifiedBy = new ObjectId(userId);
    req.body.organizationId = new ObjectId(organizationId);
    req.body.updatedTime = new Date();
    req.body.LeadsOwnerId = new ObjectId(req.body.LeadsOwnerId);
    // req.body.LeadsOwnerId = new ObjectId("65c5fba7fb3b903dccd9fba4");
    // req.body.ChannelPartnerName = req.body?.ChannelPartnerName ? new ObjectId(req.body?.ChannelPartnerName) : null;
    req.body.ChannelPartnerName = ObjectId.isValid(req.body?.ChannelPartnerName) ? new ObjectId(req.body?.ChannelPartnerName) : req.body?.ChannelPartnerName;

    const LeadData = await FindOne("leads", { _id: new ObjectId(id) });
    // //console.log("LeadData>>>>",LeadData)
    if (LeadData?.ApprovalStatus != "reject" || "approve") {
      // //console.log('existtatus')
      const payload = {
        collection: "leads",
        id,
        userId,
        organizationId,
        BodyData: req.body,
        reqMethod: req.method,
      };
      const approvle = await ProcessApprove(logger, payload);
      // if(!approvle.Authorized){
      //   const obj = {
      //     res,
      //     status: Constant.STATUS_CODE.UN_AUTHORIZED,
      //     msg: Constant.ERROR_MSGS.APPROVER_UN_AUTHORIZED,
      //   };
      //   return Response.error(obj);
      // }
    }

    // update Lead
    await UpdateOne("leads", { _id: new ObjectId(id) }, req.body);
    const obj = {
      res,
      msg: Constant.INFO_MSGS.UPDATED_SUCCESSFULLY,
      status: Constant.STATUS_CODE.OK,
      // data: userDetails,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

/**
 * Get Leads By Connection Id
 */
const getLeadsByConnId = async (req, res) => {
  const { logger } = req;
  try {
    const { organizationId, userId } = req.decoded;
    const { connectionId } = req.params;

    let { sortBy, offset, limit } = req.query;

    let queryObj = req.query;
    delete queryObj.offset;
    delete queryObj.sortBy;
    delete queryObj.limit;
    let queryObjKeys = Object.keys(queryObj);
    const orCondition = [];

    //console.log("connectionId-->", connectionId);
    //console.log("organizationId-->", organizationId);

    for (let key of queryObjKeys) {
      orCondition.push({ [key]: { $regex: queryObj[key], $options: "i" } });
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
    let filterbutton = req.body.buttonType;
    if (_.isUndefined(filterbutton) || filterbutton != "AllLeads") {
      matchCondition = await returnFilterButton(logger, filterbutton, userId);
    }
    matchCondition.organizationId = new ObjectId(organizationId);
    matchCondition.connectionId = new ObjectId(connectionId);
    if (orCondition.length) {
      matchCondition = { ...matchCondition, $or: orCondition };
    }

    //console.log("matchCondition-->", matchCondition);

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
          let: { ownerId: "$LeadsOwnerId" },
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
    const leadsData = await Aggregation("leads", aggregationQuery);
    //console.log("leadsData", leadsData);
    if (!leadsData[0].paginatedResult.length) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: `Leads ${Constant.INFO_MSGS.NO_DATA}`,
      };
      return Response.error(resp);
    }
    const obj = {
      res,
      msg: Constant.INFO_MSGS.SUCCESS,
      status: Constant.STATUS_CODE.OK,
      data: {
        leadsData: leadsData[0].paginatedResult,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: leadsData[0].totalCount[0].count,
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
          from: "leads",
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
    const fileTypeField = await getOnlyTypeFileKeys("Leads", organizationId);
    const leadsData = await Aggregation("leads", aggregationQuery);
    //console.log('leadsData', leadsData[0])
    // return
    if (leadsData.length == 0) {
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
      data: Object.keys(leadsData[0].FieldsData).filter(
        (item) => !fileTypeField.includes(item)
      ),
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
      "leads",
      { _id: { $in: pinArr }, organizationId: new ObjectId(organizationId) },
      { LeadsOwnerId: new ObjectId(toUserm) }
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
    const listData = await DeleteMany("leads", {
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
      "leads",
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
 * Create Data From Leads Excel
 */
const addLeadsExcel = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;

    let IdRegExp = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i;
    var listArr = [];

    for (let i = 0; i < req.body.length; i++) {
      var ResObj = {};

      // const LeadsOwnerId = req.body[i].LeadsOwnerId;
      // let ownerIdTest = IdRegExp.test(LeadsOwnerId);

      // if (_.isUndefined(LeadsOwnerId) || ownerIdTest == false) {
      //   // //console.log(`Enter if ${i+1}`)
      //   ResObj["raw"] = i + 1;
      //   ResObj["error"] = true;
      //   ResObj["Message"] = "Please Enter LeadsOwnerId";
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

      req.body[i].LeadsOwnerId = new ObjectId(userId);
      req.body[i].organizationId = new ObjectId(organizationId);
      req.body[i].createdTime = new Date();
      req.body[i].updatedTime = null;

      // For Leads Create Under Any Connection
      if (req.body[i].connectionId) {
        req.body[i].connectionId = new ObjectId(req.body[i].connectionId);
      } else {
        req.body[i].connectionId = null;
      }
      // Create Lead
      await InsertOne("leads", req.body[i]);
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

module.exports = {
  createLeads,
  getLeads,
  getleadsById,
  updateLeads,
  getFilterField,
  getLeadsByConnId,
  massTransfer,
  massDelete,
  massUpdate,
  addLeadsExcel,
};
