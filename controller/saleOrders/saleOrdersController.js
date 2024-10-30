const bcrypt = require("bcrypt");
const { handleException } = require("../../helpers/exception");
const Response = require("../../helpers/response");
const Constant = require("../../helpers/constant");
const ProfileValidation = require("../../helpers/joi-validation");
const {
  returnFilterByFieldQuery,
  returnFilterButton,
} = require("../../utility/filter");
const { dataSharing } = require("../../utility/dataSharing");
const deleteAllRecord = require("../../utility/deleteAllRecord");
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
/**
 * Create saleOrders
 */
const createSaleOrder = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    let IdRegExp = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i;
    let ownerIdTest = IdRegExp.test(req.body.SalesOrderOwnerId);

    if (!req.body.SalesOrderOwnerId) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: "Please Add Key-Value Pair Of SalesOrderOwnerId",
      };
      return Response.error(resp);
    }
    if (ownerIdTest == false) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: "Not Valid SalesOrderOwnerId",
      };
      return Response.error(resp);
    }
    req.body.SalesOrderOwnerId = new ObjectId(req.body.SalesOrderOwnerId);
    req.body.organizationId = new ObjectId(organizationId);
    req.body.CreatedBy = new ObjectId(userId);
    req.body.DueDate = new Date(req.body.DueDate);
    req.body.createdTime = new Date();
    req.body.updatedTime = null;
    req.body.CompanyName = ObjectId.isValid(req.body?.CompanyName) ? new ObjectId(req.body?.CompanyName) : req.body?.CompanyName;
    req.body.OpportunityName = ObjectId.isValid(req.body?.OpportunityName) ? new ObjectId(req.body?.OpportunityName) : req.body?.OpportunityName;
    req.body.ContactName = ObjectId.isValid(req.body?.ContactName) ? new ObjectId(req.body?.ContactName) : req.body?.ContactName;

    // For createSaleOrder  Under Any Connection
    if (req.body.connectionId) {
      const userInfo = await FindOne("users", {
        _id: new ObjectId(req.body.SalesOrderOwnerId),
      });

      let data = {
        msg: "Sale Order Created By " + userInfo.firstName + userInfo.lastName,
        data: req.body,
      };
      TimeLine.insertTimeLine(logger, req.body.connectionId, data);

      req.body.connectionId = new ObjectId(req.body.connectionId);
    } else {
      req.body.connectionId = null;
    }
    console.log("req.body", req.body);

    // Create saleOrders
    await InsertOne("saleOrders", req.body);
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
 * Get order
 */
const getSaleOrder = async (req, res) => {
  const { logger } = req;
  try {
    const { organizationId, userId, role } = req.decoded;

    let { sortBy, offset, limit, roleTitle, mass = false } = req.body;

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
    console.log("req", req.body);
    if (roleTitle != undefined && roleTitle != "CEO") {

      // matchCondition.SalesOrderOwnerId = new ObjectId(userId);
      matchCondition = await dataSharing(req, 'Sales Orders', 'SalesOrderOwnerId', mass);
    }
    if (role !== "CEO") {
      matchCondition["SalesOrderOwnerId"] = new ObjectId(userId);
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
          let: { ownerId: "$SalesOrderOwnerId" },
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
          from: "contacts",
          localField: "ContactName",
          foreignField: "_id",
          as: "ContactData",
        },
      },
      {
        $lookup: {
          from: "accounts",
          localField: "CompanyName",
          foreignField: "_id",
          as: "AccountData",
        },
      },
      {
        $lookup: {
          from: "deals",
          localField: "OpportunityName",
          foreignField: "_id",
          as: "OpportunitiesData",
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
    const orderData = await Aggregation("saleOrders", aggregationQuery);
    if (!orderData[0].paginatedResult.length) {
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
        orderData: orderData[0].paginatedResult,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: orderData[0].totalCount[0].count,
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
 * get By id order
 */
const getSaleOrderById = async (req, res) => {
  const { logger } = req;
  try {
    const { id } = req.params;
    const { userId, organizationId } = req.decoded;
    // Create order
    const infoData = await FindOne("saleOrders", { _id: new ObjectId(id) });

    if (!infoData) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.INFO_MSGS.NO_DATA,
      };
      return Response.error(resp);
    }
    await UpdateOne(
      "saleOrders",
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
 * Update order
 */
const updateSaleOrder = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    const { id } = req.params;
    req.body.ModifiedBy = new ObjectId(userId);
    req.body.organizationId = new ObjectId(organizationId);
    req.body.DueDate = new Date(req.body.DueDate);
    req.body.updatedTime = new Date();
    req.body.SalesOrderOwnerId = new ObjectId(req.body.SalesOrderOwnerId);
    req.body.CompanyName = ObjectId.isValid(req.body?.CompanyName) ? new ObjectId(req.body?.CompanyName) : req.body?.CompanyName;
    req.body.OpportunityName = ObjectId.isValid(req.body?.OpportunityName) ? new ObjectId(req.body?.OpportunityName) : req.body?.OpportunityName;
    req.body.ContactName = ObjectId.isValid(req.body?.ContactName) ? new ObjectId(req.body?.ContactName) : req.body?.ContactName;

    await UpdateOne("saleOrders", { _id: new ObjectId(id) }, req.body);
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
        $match: {
          organizationId: new ObjectId(organizationId),
          formTitle: "salesOrder"
        }
      },
      {
        $project: {
          sections: 1, // Include only the sections field
        }
      },
      {
        $sort: { _id: -1 }, // Sort by _id or any other criteria if needed
        // Optionally, limit the number of documents if needed
        // $limit: 1,
      }
    ];


    const fieldData = await Aggregation("forms", aggregationQuery);

    let ownerValues = [];
    fieldData.forEach(doc => {
      doc.sections.forEach(section => {
        Object.keys(section.inputs).forEach(inputKey => {
          let input = section.inputs[inputKey];
          if (input?.value) {
            ownerValues.push(input.value);
          }
        });
      });
    });
    console.log("organizationId1111111111111", JSON.stringify([...new Set(ownerValues)], null, 4));
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
      data: [...new Set(ownerValues)],//Object.keys(fieldData[0].FieldsData),
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

/**
 * Get SaleOrder By Connection Id
 */
const getSaleOrderByConnId = async (req, res) => {
  const { logger } = req;
  try {
    const { organizationId, userId } = req.decoded;
    const { connectionId } = req.params;
    // console.log("connectionId==>", connectionId);
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
    // for (let key of queryObjKeys) {
    //   orCondition.push({ [key]: queryObj[key] });
    // }
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
    matchCondition.organizationId = new ObjectId(organizationId);
    matchCondition.connectionId = new ObjectId(connectionId);
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
        $lookup: {
          let: { ownerId: "$SalesOrderOwnerId" },
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
    const saleOrderData = await Aggregation("saleOrders", aggregationQuery);
    console.log("aggregationQuery", JSON.stringify(aggregationQuery), saleOrderData);
    if (!saleOrderData[0].paginatedResult.length) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: `Sale Orders ${Constant.INFO_MSGS.NO_DATA}`,
      };
      return Response.error(resp);
    }
    const obj = {
      res,
      msg: Constant.INFO_MSGS.SUCCESS,
      status: Constant.STATUS_CODE.OK,
      data: {
        saleOrderData: saleOrderData[0].paginatedResult,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: saleOrderData[0].totalCount[0].count,
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
      "saleOrders",
      { _id: { $in: pinArr }, organizationId: new ObjectId(organizationId) },
      { SalesOrderOwnerId: new ObjectId(toUserm) }
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
    const listData = await DeleteMany("saleOrders", {
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
      "saleOrders",
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
 * Create SaleOrder by Excel
 */
const addSaleOrderExcel = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;

    let IdRegExp = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i;
    var listArr = [];

    for (let i = 0; i < req.body.length; i++) {
      var ResObj = {};

      // const SalesOrderOwnerId = req.body[i].SalesOrderOwnerId;
      // let ownerIdTest = IdRegExp.test(SalesOrderOwnerId);

      // if (_.isUndefined(SalesOrderOwnerId) || ownerIdTest == false) {
      //   // //console.log(`Enter if ${i+1}`)
      //   ResObj["raw"] = i + 1;
      //   ResObj["error"] = true;
      //   ResObj["Message"] = "Please Enter SalesOrderOwnerId";
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

      req.body[i].SalesOrderOwnerId = new ObjectId(userId);
      req.body[i].organizationId = new ObjectId(organizationId);
      req.body[i].DueDate = new Date(req.body[i].DueDate);
      req.body[i].createdTime = new Date();
      req.body[i].updatedTime = null;

      // For createSaleOrder  Under Any Connection
      if (req.body[i].connectionId) {
        const userInfo = await FindOne("users", {
          _id: new ObjectId(req.body[i].SalesOrderOwnerId),
        });

        let data = {
          msg:
            "Sale Order Created By " + userInfo.firstName + userInfo.lastName,
          data: req.body[i],
        };
        TimeLine.insertTimeLine(logger, req.body[i].connectionId, data);

        req.body[i].connectionId = new ObjectId(req.body[i].connectionId);
      } else {
        req.body[i].connectionId = null;
      }
      // Create saleOrders
      await InsertOne("saleOrders", req.body[i]);
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
  createSaleOrder,
  getSaleOrder,
  getSaleOrderById,
  updateSaleOrder,
  getFilterField,
  getSaleOrderByConnId,
  massTransfer,
  massDelete,
  massUpdate,
  addSaleOrderExcel,
};
