const bcrypt = require("bcrypt");
const { handleException, isHexadecimal } = require("../../helpers/exception");
const Response = require("../../helpers/response");
const Constant = require("../../helpers/constant");
const ProfileValidation = require("../../helpers/joi-validation");
const { ProcessApprove } = require("../../utility/processApprov");
const {
  returnFilterByFieldQuery,
  returnFilterButton,
} = require("../../utility/filter");
const { dataSharing } = require("../../utility/dataSharing");
const deleteAllRecord = require("../../utility/deleteAllRecord");
const TimeLine = require("../../helpers/timeline");
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
  FindOne1,
  Count,
  UpdateMany,
  PermanentDelete,
  DeleteMany,
} = require("../../library/methods");
const { getOnlyTypeFileKeys } = require("../settings/formController");
const dateFormat = require("../../helpers/dateFormat");
/**
 * Create call
 */
const createCall = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    let IdRegExp = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i;
    let ownerIdTest = IdRegExp.test(req.body.CallsOwnerId);

    if (!req.body.CallsOwnerId) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: "Please Add Key-Value Pair Of CallsOwnerId",
      };
      return Response.error(resp);
    }
    if (ownerIdTest == false) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: "Not Valid CallsOwnerId",
      };
      return Response.error(resp);
    }
    req.body.CallsOwnerId = new ObjectId(req.body.CallsOwnerId);
    req.body.CreatedBy = new ObjectId(userId);
    req.body.organizationId = new ObjectId(organizationId);
    // req.body.CallStartTime = new Date(req.body.CallStartTime);
    req.body.RelatedTo = ObjectId.isValid(req.body?.RelatedTo) ? new ObjectId(req.body?.RelatedTo) : req.body?.RelatedTo;
    req.body.ContactName = ObjectId.isValid(req.body?.ContactName) ? new ObjectId(req.body?.ContactName) : req.body?.ContactName;


    if (req.body.CallEndTime != null) {
      req.body.CallEndTime = new Date(req.body.CallEndTime);
    } else {
      req.body.CallEndTime = null;
    }

    (req.body.createdTime = new Date()), (req.body.updatedTime = null);

    // For Call Create Under Any Connection
    if (req.body.connectionId) {
      const userInfo = await FindOne("users", {
        _id: new ObjectId(req.body.CallsOwnerId),
      });

      let data = {
        msg: "Call Created By " + +userInfo.firstName + userInfo.lastName,
        data: req.body,
      };
      TimeLine.insertTimeLine(logger, req.body.connectionId, data);

      req.body.connectionId = new ObjectId(req.body.connectionId);
    } else {
      req.body.connectionId = null;
    }

    // Create call
    const convertedPayload = dateFormat.convertStringsToDates([req.body]);
    console.log("convertedPayload", convertedPayload);
    await InsertOne("calls", convertedPayload[0]);
    // await InsertOne("calls", req.body);
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

// function isHexadecimal(s) {
//   try {
//     // Attempt to parse the string as an integer in base 16 (hexadecimal)
//     let value = parseInt(s, 16);
//     return !isNaN(value); // If successful, the string is hexadecimal
//   } catch (e) {
//     return false; // If an exception is caught, the string is not hexadecimal
//   }
// }

/**
 * Get call
 */
const getCall = async (req, res) => {
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
      // matchCondition.CallsOwnerId = new ObjectId(userId);
      matchCondition = await dataSharing(req, "calls", "CallsOwnerId", mass);
    }
    if (role !== "CEO") {
      matchCondition["CallsOwnerId"] = new ObjectId(userId);
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
          let: { ownerId: "$CallsOwnerId" },
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
          as: "contactData",
        },
      },
      {
        $lookup: {
          from: "accounts",
          localField: "RelatedTo",
          foreignField: "_id",
          as: "accountData",
        },
      },
      {
        $lookup: {
          from: "contacts",
          localField: "RelatedTo",
          foreignField: "_id",
          as: "accountData1",
        },
      },
      {
        $lookup: {
          from: "deals",
          localField: "RelatedTo",
          foreignField: "_id",
          as: "accountData2",
        },
      },
      {
        $lookup: {
          from: "leads",
          localField: "RelatedTo",
          foreignField: "_id",
          as: "accountData3",
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
    const callData = await Aggregation("calls", aggregationQuery);
    if (!callData[0].paginatedResult.length) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.INFO_MSGS.NO_DATA,
      };
      return Response.error(resp);
    } else {



      const obj = {
        res,
        msg: Constant.INFO_MSGS.SUCCESS,
        status: Constant.STATUS_CODE.OK,
        data: {
          callData: callData[0].paginatedResult,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total: callData[0].totalCount[0].count,
          },
        },
      };
      return Response.success(obj);
    }
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

const getCall_date = async (req, res) => {
  const { logger } = req;
  try {
    const { organizationId, userId } = req.decoded;

    matchCondition.CallsOwnerId = new ObjectId(userId);
    matchCondition.CallStartTime = new Date();

    let aggregationQuery = [
      {
        $match: matchCondition,
      },
    ];
    const callData = await Aggregation("calls", aggregationQuery);
    if (!callData[0].paginatedResult.length) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.INFO_MSGS.NO_DATA,
      };
      return Response.error(resp);
    } else {
      const obj = {
        res,
        msg: Constant.INFO_MSGS.SUCCESS,
        status: Constant.STATUS_CODE.OK,
        data: {
          callData: newArray,
        },
      };

      return Response.success(obj);
    }
    //  });
    // }
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

/**
 * get By id call
 */
const getCallById = async (req, res) => {
  const { logger } = req;
  try {
    const { id } = req.params;
    const { userId, organizationId } = req.decoded;
    // Create call
    const infoData = await FindOne("calls", { _id: new ObjectId(id) });

    if (!infoData) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.INFO_MSGS.NO_DATA,
      };
      return Response.error(resp);
    }
    await UpdateOne(
      "calls",
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
 * Update call
 */
const updateCall = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    const { id } = req.params;
    req.body.ModifiedBy = new ObjectId(userId);
    req.body.organizationId = new ObjectId(organizationId);
    // req.body.CallStartTime = new Date(req.body.CallStartTime);
    req.body.updatedTime = new Date();
    req.body.CallsOwnerId = new ObjectId(req.body.CallsOwnerId);
    req.body.RelatedTo = ObjectId.isValid(req.body?.RelatedTo) ? new ObjectId(req.body?.RelatedTo) : req.body?.RelatedTo;
    req.body.ContactName = ObjectId.isValid(req.body?.ContactName) ? new ObjectId(req.body?.ContactName) : req.body?.ContactName;


    // console.log("Update calls logs",req.body)
    // Approval Process Apply
    const callsData = await FindOne("calls", { _id: new ObjectId(id) });
    console.log("callsData", callsData)
    if (callsData?.ApprovalStatus != "reject" || "approve") {
      const payload = {
        collection: "calls",
        id,
        userId,
        organizationId,
        BodyData: req.body,
        reqMethod: req.method,
      };
      await ProcessApprove(logger, payload);
    }

    // For Call Create Under Any Connection
    if (callsData?.connectionId) {
      const userInfo = await FindOne("users", {
        _id: new ObjectId(req.body.CallsOwnerId),
      });

      let data = {
        msg: "Call Created By " + +userInfo.firstName + userInfo.lastName,
        data: req.body,
      };

      await TimeLine.insertTimeLine(logger, callsData?.connectionId, data);
      //req.body.connectionId = new ObjectId(req.body.connectionId);
    } 

    const convertedPayload = dateFormat.convertStringsToDates([req.body]);
    console.log("convertedPayload", convertedPayload);
    await UpdateOne("calls", { _id: new ObjectId(id) }, convertedPayload[0]);

    const obj = {
      res,
      msg: Constant.INFO_MSGS.UPDATED_SUCCESSFULLY,
      status: Constant.STATUS_CODE.OK,
    };
    return Response.success(obj);
  } catch (error) {
    console.log("error", error);
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
    const fileTypeField = await getOnlyTypeFileKeys("Calls", organizationId);
    let aggregationQuery = [
      {
        $match: { organizationId: new ObjectId(organizationId) },
      },
      { $project: { numFields: { $size: { $objectToArray: "$$ROOT" } } } },
      { $sort: { numFields: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: "calls",
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
    const fieldData = await Aggregation("calls", aggregationQuery);
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

// const getFilterFieldDate = async (req, res) => {
//   const { logger } = req;
//   try {
//     const { organizationId, userId } = req.decoded;
//     const fileTypeField = await getOnlyTypeFileKeys("Calls", organizationId);
//     let aggregationQuery = [
//       {
//         $match: { organizationId: new ObjectId(organizationId) },
//       },
//       { $project: { numFields: { $size: { $objectToArray: "$$ROOT" } } } },
//       { $sort: { numFields: -1 } },
//       { $limit: 1 },
//       {
//         $lookup: {
//           from: "calls",
//           localField: "_id",
//           foreignField: "_id",
//           as: "FieldsData",
//         },
//       },
//       {
//         $unwind: {
//           path: "$FieldsData",
//           preserveNullAndEmptyArrays: false,
//         },
//       },
//     ];
//     const fieldData = await Aggregation("calls", aggregationQuery);
//     if (fieldData.length == 0) {
//       const resp = {
//         res,
//         status: Constant.STATUS_CODE.BAD_REQUEST,
//         msg: Constant.INFO_MSGS.NO_DATA,
//       };
//       return Response.error(resp);
//     }
//     const obj = {
//       res,
//       msg: Constant.INFO_MSGS.SUCCESS,
//       status: Constant.STATUS_CODE.OK,
//       data: Object.keys(fieldData[0].FieldsData).filter(
//         (item) => !fileTypeField.includes(item)
//       ),
//     };
//     return Response.success(obj);
//   } catch (error) {
//     //console.log("error", error);
//     return handleException(logger, res, error);
//   }
// };

/**
 * Get Calls By Connection Id
 */
const getCallByConnId = async (req, res) => {
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

    for (let key of queryObjKeys) {
      orCondition.push({ [key]: queryObj[key] });
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
          let: { ownerId: "$CallsOwnerId" },
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
    const callData = await Aggregation("calls", aggregationQuery);
    if (!callData[0].paginatedResult.length) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: `Calls ${Constant.INFO_MSGS.NO_DATA}`,
      };
      return Response.error(resp);
    }
    const obj = {
      res,
      msg: Constant.INFO_MSGS.SUCCESS,
      status: Constant.STATUS_CODE.OK,
      data: {
        callData: callData[0].paginatedResult,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: callData[0].totalCount[0].count,
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
      "calls",
      { _id: { $in: pinArr }, organizationId: new ObjectId(organizationId) },
      { CallsOwnerId: new ObjectId(toUserm) }
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
    const listData = await DeleteMany("calls", {
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
      "calls",
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
 * Get Scheduled Call
 */
const getScheduledCall = async (req, res) => {
  const { logger } = req;
  try {
    const { organizationId, userId } = req.decoded;
    let { sortBy, offset, limit } = req.body;

    matchCondition = {};
    let filterArray = req.body.search;
    if (filterArray) {
      matchCondition = await returnFilterByFieldQuery(logger, filterArray);
    }
    const currentTime = new Date();
    const futureTime = new Date(currentTime.getTime() + 30 * 60000);
    // //console.log(futureTime)
    // //console.log('currentTime',currentTime)

    matchCondition.organizationId = new ObjectId(organizationId);
    matchCondition.CallsOwnerId = new ObjectId(userId);
    matchCondition.callSchedule = true;
    matchCondition.CallStartTime = futureTime;

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
          let: { ownerId: "$CallsOwnerId" },
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
    const callData = await Aggregation("calls", aggregationQuery);
    if (!callData[0].paginatedResult.length) {
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
        callData: callData[0].paginatedResult,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: callData[0].totalCount[0].count,
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
 * Add Call Excel
 */
const addCallExcel = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;

    let IdRegExp = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i;
    var listArr = [];

    for (let i = 0; i < req.body.length; i++) {
      var ResObj = {};

      // const CallsOwnerId = req.body[i].CallsOwnerId;
      // let ownerIdTest = IdRegExp.test(CallsOwnerId);

      // //console.log(`CallsOwnerId ${i+1}-->`,CallsOwnerId);
      // //console.log(`ownerIdTest ${i+1}-->`,ownerIdTest);

      // if (_.isUndefined(CallsOwnerId) || ownerIdTest == false) {
      //   //console.log(`Enter if ${i + 1}`);
      //   ResObj["raw"] = i + 1;
      //   ResObj["error"] = true;
      //   ResObj["Message"] = "Please Enter CallsOwnerId";
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

      req.body[i].CallsOwnerId = new ObjectId(userId);
      req.body[i].organizationId = new ObjectId(organizationId);
      // req.body[i].CallStartTime = new Date(req.body[i].CallStartTime);
      (req.body[i].createdTime = new Date()), (req.body[i].updatedTime = null);

      // For Call Create Under Any Connection
      if (req.body[i].connectionId) {
        const userInfo = await FindOne("users", {
          _id: new ObjectId(req.body[i].CallsOwnerId),
        });

        let data = {
          msg: "Call Created By " + userInfo.firstName + userInfo.lastName,
          data: req.body[i],
        };
        TimeLine.insertTimeLine(logger, req.body[i].connectionId, data);

        req.body[i].connectionId = new ObjectId(req.body[i].connectionId);
      } else {
        req.body[i].connectionId = null;
      }

      // Create call
      await InsertOne("calls", req.body[i]);
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
  createCall,
  getCall,
  getCallById,
  updateCall,
  getFilterField,
  getCall_date,
  getCallByConnId,
  massTransfer,
  massDelete,
  massUpdate,
  getScheduledCall,
  addCallExcel,
};
