const bcrypt = require("bcrypt");
const { handleException } = require("../../helpers/exception");
const Response = require("../../helpers/response");
const Constant = require("../../helpers/constant");
const ProfileValidation = require("../../helpers/joi-validation");
const {
  returnFilterByFieldQuery,
  returnFilterButton,
} = require("../../utility/filter");
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
  Count,
  PermanentDelete,
} = require("../../library/methods");
/**
 * Create SMS
 */
const createSms = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    req.body.SmsOwnerId = new ObjectId(userId);
    req.body.organizationId = new ObjectId(organizationId);
    req.body.createdTime = new Date();
    req.body.updatedTime = null;

    // Create Sms
    await InsertOne("sms", req.body);
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
 * Get Sms
 */
const getSms = async (req, res) => {
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
          let: { ownerId: "$SmsOwnerId" },
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
    const SmsData = await Aggregation("sms", aggregationQuery);

    if (!SmsData[0].paginatedResult.length) {
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
        SmsData: SmsData[0].paginatedResult,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: SmsData[0].totalCount[0].count,
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
 * get By id Sms
 */
const getSmsById = async (req, res) => {
  const { logger } = req;
  try {
    const { id } = req.params;
    const { userId, organizationId } = req.decoded;
    // Create Sms
    const SmsData = await FindOne("sms", { _id: new ObjectId(id) });

    if (!SmsData) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.INFO_MSGS.NO_DATA,
      };
      return Response.error(resp);
    }
    await UpdateOne(
      "sms",
      { _id: new ObjectId(id) },
      { read: true, tuch: true }
    );
    const obj = {
      res,
      msg: Constant.INFO_MSGS.SUCCESS,
      status: Constant.STATUS_CODE.OK,
      data: SmsData,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

/**
 * Update Sms
 */
const updateSms = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    const { id } = req.params;
    req.body.ModifiedBy = new ObjectId(userId);
    req.body.organizationId = new ObjectId(organizationId);
    req.body.updatedTime = new Date();

    await UpdateOne("sms", { _id: new ObjectId(id) }, req.body);
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
 * Get Filter Sms Field
 */
const getFilterSmsField = async (req, res) => {
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
          from: "sms",
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
    const SmsFieldData = await Aggregation("sms", aggregationQuery);
    if (!SmsFieldData) {
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
      data: Object.keys(SmsFieldData[0].FieldsData),
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

/**
 * Delete SMS Template
 */
const deleteSMSTemplate = async (req, res) => {
  const { logger } = req;
  try {
    const { id } = req.params;
    await PermanentDelete("sms", { _id: new ObjectId(id) });
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
 * Send SMS
 */
const sendSms = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    req.body.SmsOwnerId = new ObjectId(userId);
    req.body.organizationId = new ObjectId(organizationId);
    req.body.templateId = new ObjectId(req.body.templateId);
    req.body.createdTime = new Date();
    req.body.updatedTime = null;

    if (req.body.connectionId) {
      const userInfo = await FindOne("users", {
        _id: new ObjectId(userId),
      });

      let data = {
        msg: "Sms Created By " + userInfo.firstName + userInfo.lastName,
        data: req.body,
      };
      TimeLine.insertTimeLine(logger, req.body.connectionId, data);

      req.body.connectionId = new ObjectId(req.body.connectionId);
    } else {
      req.body.connectionId = null;
    }

    // Create sendSms
    await InsertOne("sendsms", req.body);
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
 * Get sent sms By Connection Id
 */
const getSentSmsByConnId = async (req, res) => {
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
          let: { ownerId: "$SmsOwnerId" },
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
          from: "sms",
          localField: "templateId",
          foreignField: "_id",
          as: "sendSmsData",
        },
      },
      {
        $unwind: {
          path: "$sendSmsData",
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
    const sentSmsData = await Aggregation("sendsms", aggregationQuery);
    if (!sentSmsData[0].paginatedResult.length) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: `Sent-SMS ${Constant.INFO_MSGS.NO_DATA}`,
      };
      return Response.error(resp);
    }
    const obj = {
      res,
      msg: Constant.INFO_MSGS.SUCCESS,
      status: Constant.STATUS_CODE.OK,
      data: {
        sentSmsData: sentSmsData[0].paginatedResult,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: sentSmsData[0].totalCount[0].count,
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
 * Get sent sms By Id
 */
const getSentSmsById = async (req, res) => {
  const { logger } = req;
  try {
    const { organizationId, userId } = req.decoded;
    const { id } = req.params;

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
    matchCondition._id = new ObjectId(id);
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
          let: { ownerId: "$SmsOwnerId" },
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
          from: "sms",
          localField: "templateId",
          foreignField: "_id",
          as: "sendSmsData",
        },
      },
      {
        $unwind: {
          path: "$sendSmsData",
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
    const sentSmsData = await Aggregation("sendsms", aggregationQuery);
    if (!sentSmsData[0].paginatedResult.length) {
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
        sentSmsData: sentSmsData[0].paginatedResult,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: sentSmsData[0].totalCount[0].count,
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
 * Get Sent SMS
 */
// const getSentSms = async (req, res) => {
//   const { logger } = req;
//   try {
//     const { organizationId, userId } = req.decoded;
//     let { sortBy, offset, limit } = req.query;

//     let queryObj = req.query;
//     delete queryObj.offset;
//     delete queryObj.sortBy;
//     delete queryObj.limit;
//     let queryObjKeys = Object.keys(queryObj);
//     const orCondition = [];

//     for (let key of queryObjKeys) {
//       orCondition.push({ [key]: queryObj[key] });
//     }
//     // if (_.isUndefined(query)) query = '';
//     if (sortBy === "recent") {
//       sortBy = { createdTime:-1 };
//     } else {
//       sortBy = { createdTime: 1 };
//     }
//     offset = offset || 1;
//     limit = limit || 10;
//     const skip = limit * (offset - 1);
//     let matchCondition = {};

//     matchCondition.organizationId = new ObjectId(organizationId);
//     if (orCondition.length) {
//       matchCondition = { ...matchCondition, $or: orCondition };
//     }

//     let aggregationQuery = [
//       {
//         $match: matchCondition,
//       },
//       {
//         $lookup: {
//           from: "organization",
//           localField: "organizationId",
//           foreignField: "_id",
//           as: "organizationData",
//         },
//       },
//       {
//         $unwind: {
//           path: "$organizationData",
//           preserveNullAndEmptyArrays: false,
//         },
//       },
//       {
//         $lookup: {
//           let: { ownerId: "$SmsOwnerId" },
//           from: "users",
//           pipeline: [
//             {
//               $match: {
//                 $expr: { $eq: ["$_id", "$$ownerId"] },
//               },
//             },
//             { $project: { _id: 1,firstName: 1 , lastName:1 } },
//           ],
//           as: "ownerData",
//         },
//       },
//       {
//         $unwind: {
//           path: "$ownerData",
//           preserveNullAndEmptyArrays: false,
//         },
//       },
//       {
//         $facet: {
//           paginatedResult: [{ $skip: skip }, { $limit: parseInt(limit) }],
//           totalCount: [{ $count: "count" }],
//         },
//       },
//     ];
//     const sendSmsData = await Aggregation("sendsms", aggregationQuery);

//     if (!sendSmsData[0].paginatedResult.length) {
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
//       data: {
//         sendSmsData: sendSmsData[0].paginatedResult,
//         pagination: {
//           limit: parseInt(limit),
//           offset: parseInt(offset),
//           total: sendSmsData[0].totalCount[0].count,
//         },
//       },
//     };
//     return Response.success(obj);
//   } catch (error) {
//     //console.log("error", error);
//     return handleException(logger, res, error);
//   }
// };

module.exports = {
  createSms,
  getSms,
  getSmsById,
  updateSms,
  getFilterSmsField,
  sendSms,
  getSentSmsByConnId,
  getSentSmsById,
  // getSentSms,
  deleteSMSTemplate,
};
