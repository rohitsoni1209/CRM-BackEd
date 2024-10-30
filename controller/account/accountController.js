const bcrypt = require("bcrypt");
const { handleException } = require("../../helpers/exception");
const Response = require("../../helpers/response");
const Constant = require("../../helpers/constant");
const { ProcessApprove } = require("../../utility/processApprov");
const {
  returnFilterByFieldQuery,
  returnFilterButton,
  fieldFilter,
} = require("../../utility/filter");
const { dataSharing } = require("../../utility/dataSharing");
const deleteAllRecord = require("../../utility/deleteAllRecord");
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
 * Create Account
 */
const createAccount = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    let IdRegExp = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i;
    let ownerIdTest = IdRegExp.test(req.body.AccountsOwnerId);

    if (!req.body.AccountsOwnerId) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: "Please Add Key-Value Pair Of AccountsOwnerId",
      };
      return Response.error(resp);
    }
    if (ownerIdTest == false) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: "Not Valid AccountsOwnerId",
      };
      return Response.error(resp);
    }
    req.body.AccountsOwnerId = new ObjectId(req.body.AccountsOwnerId);
    req.body.CreatedBy = new ObjectId(userId);
    req.body.organizationId = new ObjectId(organizationId);
    //  req.body.ChannelPartnerName = req.body?.ChannelPartnerName ? new ObjectId(req.body?.ChannelPartnerName) : null;
    req.body.ChannelPartnerName = ObjectId.isValid(req.body?.ChannelPartnerName) ? new ObjectId(req.body?.ChannelPartnerName) : req.body?.ChannelPartnerName;
    req.body.createdTime = new Date();
    req.body.updatedTime = null;
    // Create Account
    await InsertOne("accounts", req.body);
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
 * Get Account
 */
const getAccount = async (req, res) => {
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
    } else {
      matchCondition["status"] = { $ne: 0 };
    }

    // if (filterbutton) {
    //   matchCondition = await returnFilterButton(logger, filterbutton, userId);
    // }
    matchCondition.organizationId = new ObjectId(organizationId);
    if (profile != "Administrator") {
      // matchCondition.AccountsOwnerId = new ObjectId(userId);
      matchCondition = await dataSharing(
        req,
        "Accounts",
        "AccountsOwnerId",
        mass
      );
    }
    if (role !== "CEO") {
      matchCondition["AccountsOwnerId"] = new ObjectId(userId);
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
          let: { ownerId: "$AccountsOwnerId" },
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

    //console.log("accounts==>", JSON.stringify(aggregationQuery))
    const AccountData = await Aggregation("accounts", aggregationQuery);
    if (!AccountData[0].paginatedResult.length) {
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
        AccountData: AccountData[0].paginatedResult,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: AccountData[0].totalCount[0].count,
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
 * get By id Account
 */
const getAccountById = async (req, res) => {
  const { logger } = req;
  try {
    const { id } = req.params;
    const { userId, organizationId } = req.decoded;
    // Create Account
    const accountData = await FindOne("accounts", { _id: new ObjectId(id) });

    if (!accountData) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.INFO_MSGS.NO_DATA,
      };
      return Response.error(resp);
    }
    await UpdateOne(
      "accounts",
      { _id: new ObjectId(id) },
      { read: true, tuch: true }
    );
    const obj = {
      res,
      msg: Constant.INFO_MSGS.SUCCESS,
      status: Constant.STATUS_CODE.OK,
      data: accountData,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

const getAccountByName = async (req, res) => {
  const { logger } = req;
  try {
    console.log(req.query);
    const name = req.query.name;
    console.log("name///", name);
    const { userId, organizationId } = req.decoded;
    // Create Account
    const accountData = await FindOne("accounts", {
      organizationId: new ObjectId(organizationId),
      AccountName: name,
    });
    console.log("test=====>>>>>>>>>", accountData);
    if (!accountData) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        state: 0,
        msg: Constant.INFO_MSGS.NO_DATA,
      };
      return Response.error(resp);
    }
    // await UpdateOne(
    //   "accounts",
    //   { _id: new ObjectId(id) },
    //   { read: true, tuch: true }
    // );
    const obj = {
      res,
      msg: Constant.INFO_MSGS.SUCCESS,
      status: Constant.STATUS_CODE.OK,
      state: 1,
      data: accountData,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

/**
 * Update Account
 */
const updateAccount = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    const { id } = req.params;
    req.body.ModifiedBy = new ObjectId(userId);
    req.body.organizationId = new ObjectId(organizationId);
    req.body.updatedTime = new Date();
    req.body.AccountsOwnerId = new ObjectId(req.body.AccountsOwnerId);
    req.body.ChannelPartnerName = ObjectId.isValid(req.body?.ChannelPartnerName) ? new ObjectId(req.body?.ChannelPartnerName) : req.body?.ChannelPartnerName;

    const accountsData = await FindOne("accounts", { _id: new ObjectId(id) });
    if (accountsData?.ApprovalStatus != "reject" || "approve") {
      const payload = {
        collection: "accounts",
        id,
        userId,
        organizationId,
        BodyData: req.body,
        reqMethod: req.method,
      };
      await ProcessApprove(logger, payload);
    }

    await UpdateOne("accounts", { _id: new ObjectId(id) }, req.body);
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
    const fileTypeField = await getOnlyTypeFileKeys("Accounts", organizationId);
    let aggregationQuery = [
      {
        $match: { organizationId: new ObjectId(organizationId) },
      },
      { $project: { numFields: { $size: { $objectToArray: "$$ROOT" } } } },
      { $sort: { numFields: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: "accounts",
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
    const fieldData = await Aggregation("accounts", aggregationQuery);
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
      data: Object.keys(fieldData[0].FieldsData).filter(
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
      "accounts",
      { _id: { $in: pinArr }, organizationId: new ObjectId(organizationId) },
      { AccountsOwnerId: new ObjectId(toUserm) }
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
    const listData = await DeleteMany("accounts", {
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
      "accounts",
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
 * Add Excel Data
 */
const addAccountExcel = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;

    let IdRegExp = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i;
    var listArr = [];

    for (let i = 0; i < req.body.length; i++) {
      var ResObj = {};

      // const AccountsOwnerId = req.body[i].AccountsOwnerId;
      // let ownerIdTest = IdRegExp.test(AccountsOwnerId);

      // //console.log(`AccountsOwnerId ${i+1}-->`,AccountsOwnerId);
      // //console.log(`ownerIdTest ${i+1}-->`,ownerIdTest);

      // if (_.isUndefined(AccountsOwnerId) || ownerIdTest == false) {
      //   //console.log(`Enter if ${i + 1}`);
      //   ResObj["raw"] = i + 1;
      //   ResObj["error"] = true;
      //   ResObj["Message"] = "Please Enter AccountsOwnerId";
      //   ResObj["data"] = req.body[i];
      //   listArr.push(ResObj);
      //   continue;
      // } else {
      //console.log(`Enter else ${i + 1}`);
      ResObj["raw"] = i + 1;
      ResObj["error"] = false;
      ResObj["Message"] = "Created successfully";
      ResObj["data"] = req.body[i];
      listArr.push(ResObj);

      req.body[i].AccountsOwnerId = new ObjectId(userId);
      req.body[i].organizationId = new ObjectId(organizationId);
      req.body[i].createdTime = new Date();
      req.body[i].updatedTime = null;
      // Create Account
      await InsertOne("accounts", req.body[i]);
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
  createAccount,
  getAccount,
  getAccountById,
  getAccountByName,
  updateAccount,
  getFilterField,
  massTransfer,
  massDelete,
  massUpdate,
  addAccountExcel,
};
