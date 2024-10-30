const bcrypt = require("bcrypt");
const { handleException } = require("../../helpers/exception");
const Response = require("../../helpers/response");
const {
  returnFilterByFieldQuery,
  returnFilterButton,
} = require("../../utility/filter");
const { dataSharing } = require("../../utility/dataSharing");
const Constant = require("../../helpers/constant");
const ProfileValidation = require("../../helpers/joi-validation");
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
const dateFormat = require("../../helpers/dateFormat");
/**
 * Create meeting
 */
const createMeeting = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    req.body.createdBy = new ObjectId(userId);
    req.body.MeetingOwnerId = req.body.MeetingOwnerId ? new ObjectId(req.body.MeetingOwnerId) : new ObjectId(userId);
    req.body.organizationId = new ObjectId(organizationId);
    req.body.createdTime = new Date();
    req.body.updatedTime = null;
    req.body.RelatedTo = ObjectId.isValid(req.body?.RelatedTo) ? new ObjectId(req.body?.RelatedTo) : req.body?.RelatedTo;
    req.body.Host = ObjectId.isValid(req.body?.Host) ? new ObjectId(req.body?.Host) : req.body?.Host;

    if (req.body.connectionId) {
      const userInfo = await FindOne("users", {
        _id: new ObjectId(req.body.createdBy),
      });

      let data = {
        msg: "Meeting Created By " + userInfo.firstName + userInfo.lastName,
        data: req.body,
      };
      TimeLine.insertTimeLine(logger, req.body.connectionId, data);

      req.body.connectionId = new ObjectId(req.body.connectionId);
    } else {
      req.body.connectionId = null;
    }
    // req.body.From = new Date(req.body.From);
    // req.body.To = new Date(req.body.To);
    // Create meeting
    const convertedPayload = dateFormat.convertStringsToDates([req.body]);
    console.log("convertedPayload", convertedPayload);
    await InsertOne("meetings", convertedPayload[0]);
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
 * Get meeting
 */
const getMeeting = async (req, res) => {
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
      // matchCondition.MeetingOwnerId = new ObjectId(userId);
      matchCondition = await dataSharing(req, 'Meetings', 'MeetingOwnerId', mass);
    }
    if (role !== "CEO" && role == "User") {
      matchCondition["MeetingOwnerId"] = new ObjectId(userId);
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
          let: { ownerId: "$createdBy" },
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
          let: { ownerId: "$Host" },
          from: "users",
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$ownerId"] },
              },
            },
            { $project: { _id: 1, firstName: 1, lastName: 1 } },
          ],
          as: "hostData",
        },
      },
      {
        $unwind: {
          path: "$hostData",
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
    //  console.log('aggregationQuery===>', JSON.stringify(aggregationQuery))
    const meetingData = await Aggregation("meetings", aggregationQuery);
    // console.log("meetingData==>", meetingData)
    if (!meetingData[0].paginatedResult.length) {
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
        meetingData: meetingData[0].paginatedResult,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: meetingData[0].totalCount[0].count,
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
 * get By id meeting
 */
const getMeetingById = async (req, res) => {
  const { logger } = req;
  try {
    const { id } = req.params;
    const { userId, organizationId } = req.decoded;
    // Create Meeting
    const infoData = await FindOne("meetings", { _id: new ObjectId(id) });

    if (!infoData) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.INFO_MSGS.NO_DATA,
      };
      return Response.error(resp);
    }
    await UpdateOne(
      "meetings",
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
 * Get Meeting By Connection Id
 */
const getMeetingByConnId = async (req, res) => {
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
          let: { ownerId: "$createdBy" },
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
    const meetingData = await Aggregation("meetings", aggregationQuery);
    if (!meetingData[0].paginatedResult.length) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: `Meeting ${Constant.INFO_MSGS.NO_DATA}`,
      };
      return Response.error(resp);
    }
    const obj = {
      res,
      msg: Constant.INFO_MSGS.SUCCESS,
      status: Constant.STATUS_CODE.OK,
      data: {
        meetingData: meetingData[0].paginatedResult,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: meetingData[0].totalCount[0].count,
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
 * Update meeting
 */
const updateMeeting = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    const { id } = req.params;
    req.body.ModifiedBy = new ObjectId(userId);
    req.body.organizationId = new ObjectId(organizationId);
    req.body.DueDate = new Date(req.body.DueDate);
    req.body.updatedTime = new Date();
    req.body.MeetingOwnerId = req.body.MeetingOwnerId ? new ObjectId(req.body.MeetingOwnerId) : null;
    req.body.RelatedTo = ObjectId.isValid(req.body?.RelatedTo) ? new ObjectId(req.body?.RelatedTo) : req.body?.RelatedTo;
    req.body.Host = ObjectId.isValid(req.body?.Host) ? new ObjectId(req.body?.Host) : req.body?.Host;

    // Approval Process Apply
    const meetingsData = await FindOne("meetings", { _id: new ObjectId(id) });
    if (meetingsData?.ApprovalStatus != "reject" || "approve") {
      const payload = {
        collection: "meetings",
        id,
        userId,
        organizationId,
        BodyData: req.body,
        reqMethod: req.method,
      };
      await ProcessApprove(logger, payload);
    }
    const convertedPayload = dateFormat.convertStringsToDates([req.body]);
    console.log("convertedPayload", convertedPayload);
    await UpdateOne("meetings", { _id: new ObjectId(id) }, convertedPayload[0]);
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
    const fileTypeField = await getOnlyTypeFileKeys("Meeting", organizationId)
    let aggregationQuery = [
      {
        $match: { organizationId: new ObjectId(organizationId) },
      },
      { $project: { numFields: { $size: { $objectToArray: "$$ROOT" } } } },
      { $sort: { numFields: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: "meetings",
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
    const fieldData = await Aggregation("meetings", aggregationQuery);
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
      "meetings",
      { _id: { $in: pinArr }, organizationId: new ObjectId(organizationId) },
      { createdBy: new ObjectId(toUserm) }
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
    const listData = await DeleteMany("meetings", {
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
      "meetings",
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
 * Create Meeting From Excel
 */
const addMeetingExcel = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;

    let IdRegExp = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i;
    var listArr = [];

    for (let i = 0; i < req.body.length; i++) {
      var ResObj = {};

      // const MeetingsOwnerId = req.body[i].MeetingsOwnerId;
      // let ownerIdTest = IdRegExp.test(MeetingsOwnerId);

      // if (_.isUndefined(MeetingsOwnerId) || ownerIdTest == false) {
      //   // //console.log(`Enter if ${i+1}`)
      //   ResObj["raw"] = i + 1;
      //   ResObj["error"] = true;
      //   ResObj["Message"] = "Please Enter MeetingsOwnerId";
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
      //add MeetingOwnerId as userId when data come form excel
      req.body[i].MeetingOwnerId = new ObjectId(userId);
      req.body[i].createdBy = new ObjectId(userId);
      req.body[i].organizationId = new ObjectId(organizationId);
      req.body[i].createdTime = new Date();
      req.body[i].updatedTime = null;
      console.log("req.body[i]", req.body);
      if (req.body[i].connectionId) {
        const userInfo = await FindOne("users", {
          _id: new ObjectId(req.body[i].createdBy),
        });

        let data = {
          msg: "Meeting Created By " + userInfo.firstName + userInfo.lastName,
          data: req.body[i],
        };
        TimeLine.insertTimeLine(logger, req.body[i].connectionId, data);

        req.body[i].connectionId = new ObjectId(req.body[i].connectionId);
      } else {
        req.body[i].connectionId = null;
      }
      // req.body[i].From = new Date(req.body[i].From);
      // req.body[i].To = new Date(req.body[i].To);
      // Create meeting
      const convertedPayload = dateFormat.convertStringsToDates([req.body[i]]);
      console.log("convertedPayload", convertedPayload);
      await InsertOne("meetings", convertedPayload[0]);
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
    console.log("error", error);
    return handleException(logger, res, error);
  }
};

module.exports = {
  createMeeting,
  getMeeting,
  getMeetingById,
  updateMeeting,
  getFilterField,
  getMeetingByConnId,
  massTransfer,
  massDelete,
  massUpdate,
  addMeetingExcel,
};
