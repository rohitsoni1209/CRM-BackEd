const bcrypt = require("bcrypt");
const { handleException } = require("../../helpers/exception");
const Response = require("../../helpers/response");
const {
  returnFilterByFieldQuery,
  returnFilterButton,
} = require("../../utility/filter");
const Constant = require("../../helpers/constant");
const { dataSharing } = require("../../utility/dataSharing");
const deleteAllRecord = require("../../utility/deleteAllRecord");
const { ProcessApprove } = require("../../utility/processApprov");
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
  Count,
  UpdateMany,
  PermanentDelete,
  DeleteMany,
} = require("../../library/methods");
const { getOnlyTypeFileKeys } = require("../settings/formController");
/**
 * Create Inventory
 */
const createInventory = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    let IdRegExp = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i;
    let ownerIdTest = IdRegExp.test(req.body.InventoryOwnerId);

    if (!req.body.InventoryOwnerId) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: "Please Add Key-Value Pair Of InventoryOwnerId",
      };
      return Response.error(resp);
    }
    if (ownerIdTest == false) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: "Not Valid InventoryOwnerId",
      };
      return Response.error(resp);
    }
    req.body.InventoryOwnerId = new ObjectId(req.body.InventoryOwnerId);
    req.body.organizationId = new ObjectId(organizationId);
    req.body.CreatedBy = new ObjectId(userId);
    req.body.createdTime = new Date();
    req.body.updatedTime = null;
    req.body.CentreName = ObjectId.isValid(req.body?.CentreName) ? new ObjectId(req.body?.CentreName) : req.body?.CentreName;
    req.body.OccupantName = ObjectId.isValid(req.body?.OccupantName) ? new ObjectId(req.body?.OccupantName) : req.body?.OccupantName;
    req.body.AgreementSubject = ObjectId.isValid(req.body?.AgreementSubject) ? new ObjectId(req.body?.AgreementSubject) : req.body?.AgreementSubject;


    if (req.body.connectionId) {
      const userInfo = await FindOne("users", {
        _id: new ObjectId(req.body.InventoryOwnerId),
      });

      let data = {
        msg: "Inventory Created By " + userInfo.firstName + userInfo.lastName,
        data: req.body,
      };
      TimeLine.insertTimeLine(logger, req.body.connectionId, data);

      req.body.connectionId = new ObjectId(req.body.connectionId);
    } else {
      req.body.connectionId = null;
    }
    // Create inventory
    await InsertOne("inventory", req.body);
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
 * Get Inventory
 */
const getInventory = async (req, res) => {
  const { logger } = req;
  try {
    const { organizationId, userId } = req.decoded;
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
      // matchCondition.InventoryOwnerId = new ObjectId(userId);
      matchCondition = await dataSharing(req, 'inventory', 'InventoryOwnerId', mass);
    }
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
          let: { ownerId: "$InventoryOwnerId" },
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
          from: "saleOrders",
          localField: "AgreementSubject",
          foreignField: "_id",
          as: "SaleOrdersData",
        },
      },
      {
        $lookup: {
          from: "accounts",
          localField: "OccupantName",
          foreignField: "_id",
          as: "AccountData",
        },
      },
      {
        $lookup: {
          from: "deals",
          localField: "CentreName",
          foreignField: "_id",
          as: "OpportunitiesData",
        },
      },
      {
        $facet: {
          paginatedResult: [{ $skip: skip }, { $limit: parseInt(limit) }],
          totalCount: [{ $count: "count" }],
        },
      },
    ];
    const inventoryData = await Aggregation("inventory", aggregationQuery);
    if (!inventoryData[0].paginatedResult.length) {
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
        inventoryData: inventoryData[0].paginatedResult,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: inventoryData[0].totalCount[0].count,
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
 * get By id Inventory
 */
const getInventoryById = async (req, res) => {
  const { logger } = req;
  try {
    const { id } = req.params;

    const inventoryData = await FindOne("inventory", { _id: new ObjectId(id) });

    if (!inventoryData) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.INFO_MSGS.NO_DATA,
      };
      return Response.error(resp);
    }
    await UpdateOne(
      "inventory",
      { _id: new ObjectId(id) },
      { read: true, tuch: true }
    );
    const obj = {
      res,
      msg: Constant.INFO_MSGS.SUCCESS,
      status: Constant.STATUS_CODE.OK,
      data: inventoryData,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

/**
 * Get Inventory By Connection Id
 */
const getInventoryByConnId = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    const { connectionId } = req.params;

    let { sortBy, offset, limit } = req.query;

    let queryObj = req.query;
    delete queryObj.offset;
    delete queryObj.sortBy;
    delete queryObj.limit;
    let queryObjKeys = Object.keys(queryObj);
    const orCondition = [];

    for (let key of queryObjKeys) {
      orCondition.push({ [key]: { $regex: queryObj[key], $options: "i" } });
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
    let matchCondition = {};

    if (orCondition.length) {
      matchCondition = { ...matchCondition, $or: orCondition };
    }
    matchCondition.organizationId = new ObjectId(organizationId);
    matchCondition.connectionId = new ObjectId(connectionId);
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
          let: { ownerId: "$InventoryOwnerId" },
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
        $sort: sortBy,
      },
      {
        $facet: {
          paginatedResult: [{ $skip: skip }, { $limit: parseInt(limit) }],
          totalCount: [{ $count: "count" }],
        },
      },
    ];
    console.log(JSON.stringify(aggregationQuery), "aggregar ---->>>>");
    const inventoryData = await Aggregation("inventory", aggregationQuery);
    if (!inventoryData[0].paginatedResult.length) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: `Inventory ${Constant.INFO_MSGS.NO_DATA}`,
      };
      return Response.error(resp);
    }
    const obj = {
      res,
      msg: Constant.INFO_MSGS.SUCCESS,
      status: Constant.STATUS_CODE.OK,
      data: {
        inventoryData: inventoryData[0].paginatedResult,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: inventoryData[0].totalCount[0].count,
        },
      },
    };
    return Response.success(obj);
  } catch (error) {
    console.log("error", error);
    return handleException(logger, res, error);
  }
};

/**
 * Update Inventory
 */
const updateInventory = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    const { id } = req.params;
    req.body.ModifiedBy = new ObjectId(userId);
    req.body.organizationId = new ObjectId(organizationId);
    req.body.updatedTime = new Date();
    req.body.InventoryOwnerId = req.body.InventoryOwnerId ? new ObjectId(req.body.InventoryOwnerId) : null;
    req.body.CentreName = ObjectId.isValid(req.body?.CentreName) ? new ObjectId(req.body?.CentreName) : req.body?.CentreName;
    req.body.OccupantName = ObjectId.isValid(req.body?.OccupantName) ? new ObjectId(req.body?.OccupantName) : req.body?.OccupantName;
    req.body.AgreementSubject = ObjectId.isValid(req.body?.AgreementSubject) ? new ObjectId(req.body?.AgreementSubject) : req.body?.AgreementSubject;


    // Approval Process Apply
    const inventoryData = await FindOne("inventory", { _id: new ObjectId(id) });
    if (inventoryData?.ApprovalStatus != "reject" || "approve") {
      const payload = {
        collection: "inventory",
        id,
        userId,
        organizationId,
        BodyData: req.body,
        reqMethod: req.method,
      };
      await ProcessApprove(logger, payload);
    }

    await UpdateOne("inventory", { _id: new ObjectId(id) }, req.body);
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
    const fileTypeField = await getOnlyTypeFileKeys("Inventory", organizationId)
    let aggregationQuery = [
      {
        $match: { organizationId: new ObjectId(organizationId) },
      },
      { $project: { numFields: { $size: { $objectToArray: "$$ROOT" } } } },
      { $sort: { numFields: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: "inventory",
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
    const fieldData = await Aggregation("inventory", aggregationQuery);
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
 * Mass Transfer Inventory
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
      "inventory",
      { _id: { $in: pinArr }, organizationId: new ObjectId(organizationId) },
      { InventoryOwnerId: new ObjectId(toUserm) }
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
 * Mass Delete Inventory
 */
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
    const listData = await DeleteMany("inventory", {
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

/**
 * Mass Update Inventory
 */
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
      "inventory",
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
 * Add Inventory Excel
 */
const addInventoryExcel = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;

    let IdRegExp = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i;
    var listArr = [];

    for (let i = 0; i < req.body.length; i++) {
      var ResObj = {};

      // const InventoryOwnerId = req.body[i].InventoryOwnerId;
      // let ownerIdTest = IdRegExp.test(InventoryOwnerId);

      // if (_.isUndefined(InventoryOwnerId) || ownerIdTest == false) {
      //   // //console.log(`Enter if ${i+1}`)
      //   ResObj["raw"] = i + 1;
      //   ResObj["error"] = true;
      //   ResObj["Message"] = "Please Enter InventoryOwnerId";
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

      req.body[i].InventoryOwnerId = new ObjectId(userId);
      req.body[i].organizationId = new ObjectId(organizationId);
      req.body[i].createdTime = new Date();
      req.body[i].updatedTime = null;

      if (req.body[i].connectionId) {
        const userInfo = await FindOne("users", {
          _id: new ObjectId(req.body[i].InventoryOwnerId),
        });

        let data = {
          msg: "Inventory Created By " + userInfo.firstName + userInfo.lastName,
          data: req.body[i],
        };
        TimeLine.insertTimeLine(logger, req.body[i].connectionId, data);

        req.body[i].connectionId = new ObjectId(req.body[i].connectionId);
      } else {
        req.body[i].connectionId = null;
      }
      // Create inventory
      await InsertOne("inventory", req.body[i]);
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
  createInventory,
  getInventory,
  getInventoryById,
  updateInventory,
  getFilterField,
  getInventoryByConnId,
  massTransfer,
  massDelete,
  massUpdate,
  addInventoryExcel,
};
