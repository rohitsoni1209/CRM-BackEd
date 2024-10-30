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
// const db = require("../../library/mongodb");
const dateFormat = require("../../helpers/dateFormat");
const { getOnlyTypeFileKeys } = require("../settings/formController");
/**
 * Create siteVisit
 */
const createSiteVisit = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    const { Inventory } = req.body;
    let IdRegExp = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i;
    let ownerIdTest = IdRegExp.test(req.body.siteVisitOwnerId);

    if (!req.body.siteVisitOwnerId) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: "Please Add Key-Value Pair Of siteVisitOwnerId",
      };
      return Response.error(resp);
    }
    if (ownerIdTest == false) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: "Not Valid siteVisitOwnerId",
      };
      return Response.error(resp);
    }
    req.body.siteVisitOwnerId = new ObjectId(req.body.siteVisitOwnerId);
    req.body.organizationId = new ObjectId(organizationId);
    req.body.CreatedBy = new ObjectId(userId);
    req.body.createdTime = new Date();
    req.body.updatedTime = null;
    // req.body.RelatedTo = ObjectId.isValid(req.body?.RelatedTo) ? new ObjectId(req.body?.RelatedTo) : req.body?.RelatedTo;
    // req.body.ProposedInventory = ObjectId.isValid(req.body?.ProposedInventory) ? new ObjectId(req.body?.ProposedInventory) : req.body?.ProposedInventory;

    req.body.RelatedTo = ObjectId.isValid(req.body?.RelatedTo) ? new ObjectId(req.body?.RelatedTo) : req.body?.RelatedTo;
    req.body.ProposedInventory = ObjectId.isValid(req.body?.ProposedInventory) ? new ObjectId(req.body?.ProposedInventory) : req.body?.ProposedInventory;
    req.body.Host = ObjectId.isValid(req.body?.Host) ? new ObjectId(req.body?.Host) : req.body?.Host;

    if (req.body.connectionId) {
      const userInfo = await FindOne("users", {
        _id: new ObjectId(req.body.siteVisitOwnerId),
      });

      let data = {
        msg: "Site Visit Created By " + userInfo.firstName + userInfo.lastName,
        data: req.body,
      };
      TimeLine.insertTimeLine(logger, req.body.connectionId, data);

      req.body.connectionId = new ObjectId(req.body.connectionId);
    } else {
      req.body.connectionId = null;
    }
    if (req.body.Inventory) {
      req.body.Inventory = Inventory.map((e) => {
        return new ObjectId(e);
      });
    } else {
      req.body.Inventory = null;
    }
    if (req.body.Participate) {
      req.body.Participate = new ObjectId(req.body.Participate);
    } else {
      req.body.Participate = null;
    }
    // req.body.From = new Date(req.body.From);
    // req.body.To = new Date(req.body.To);
    
    const convertedPayload = dateFormat.convertStringsToDates([req.body]);
    console.log("convertedPayload", convertedPayload);
    await InsertOne("sitevisits", convertedPayload[0]);
    // await InsertOne("sitevisits", req.body);
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
 * Get siteVisit
 */
const getSiteVisit = async (req, res) => {
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
      // matchCondition.siteVisitOwnerId = new ObjectId(userId);
      matchCondition = await dataSharing(req, 'siteVisit', 'siteVisitOwnerId', mass);
    }
    if (role !== "CEO") {
      matchCondition["siteVisitOwnerId"] = new ObjectId(userId);
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
          let: { ownerId: "$siteVisitOwnerId" },
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
      // {
      //   $lookup: {
      //     let: { relatedTitle: "$RelatedTitle", relatedTo: "$RelatedTo" },
      //     from: ("Accounts").toLowerCase(),
      //     pipeline: [
      //       {
      //         $match: {
      //           $expr: { $eq: ["$_id", "$$relatedTo"] },
      //         },
      //       },
      //       { $project: { _id: 1, AccountName: 1 } },
      //     ],
      //     as: "hostDataw",
      //   },
      // },
      // {
      //   $unwind: {
      //     path: "$hostDataw",
      //     preserveNullAndEmptyArrays: true,
      //   },
      // },
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
        $unwind: {
          path: "$Inventory",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "inventory",
          localField: "Inventory",
          foreignField: "_id",
          as: "InventoryData",
        },
      },
      {
        $unwind: {
          path: "$InventoryData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "inventory",
          localField: "ProposedInventory",
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
      // {
      //   $group: {
      //     _id: "$_id",
      //     SiteVisitTitle: { $first: "$SiteVisitTitle" },
      //     Location: { $first: "$Location" },
      //     From: { $first: "$From" },
      //     To: { $first: "$To" },
      //     Participate: { $first: "$Participate" },
      //     connectionId: { $first: "$connectionId" },
      //     siteVisitOwnerId: { $first: "$siteVisitOwnerId" },
      //     organizationId: { $first: "$organizationId" },
      //     organizationData: { $first: "$organizationData" },
      //     ownerData: { $first: "$ownerData" },
      //     ModifiedBy: { $first: "$ModifiedBy" },
      //     InventoryData: {
      //       $push: "$InventoryData",
      //     }, // Collect the lookup results in the userListData field
      //   },
      // },
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
    console.log("site vist-->", JSON.stringify(aggregationQuery))
    const siteVisitData = await Aggregation("sitevisits", aggregationQuery);
    if (!siteVisitData[0].paginatedResult.length) {
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
        siteVisitData: siteVisitData[0].paginatedResult,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: siteVisitData[0].totalCount[0].count,
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
 * get By id siteVisit
 */
const getSiteVisitById = async (req, res) => {
  const { logger } = req;
  try {
    const { id } = req.params;
    const { userId, organizationId } = req.decoded;
    // Create siteVisit
    const siteVisitData = await FindOne("sitevisits", {
      _id: new ObjectId(id),
    });

    if (!siteVisitData) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.INFO_MSGS.NO_DATA,
      };
      return Response.error(resp);
    }
    await UpdateOne(
      "sitevisits",
      { _id: new ObjectId(id) },
      { read: true, tuch: true }
    );
    const obj = {
      res,
      msg: Constant.INFO_MSGS.SUCCESS,
      status: Constant.STATUS_CODE.OK,
      data: siteVisitData,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

/**
 * Get siteVisit By Connection Id
 */
const getSiteVisitByConnId = async (req, res) => {
  const { logger } = req;
  try {
    const { organizationId, userId } = req.decoded;
    const { connectionId } = req.params;
    //console.log("connectionId==>0", connectionId);
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
          let: { ownerId: "$siteVisitOwnerId" },
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
        $unwind: {
          path: "$Inventory",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "inventory",
          localField: "Inventory",
          foreignField: "_id",
          as: "InventoryData",
        },
      },
      {
        $unwind: {
          path: "$InventoryData",
          preserveNullAndEmptyArrays: true,
        },
      },
      // {
      // $group: {
      //   _id: "$_id",
      //   SiteVisitTitle: { $first: "$SiteVisitTitle" },
      //   Location: { $first: "$Location" },
      //   From: { $first: "$From" },
      //   To: { $first: "$To" },
      //   Participate: { $first: "$Participate" },
      //   connectionId: { $first: "$connectionId" },
      //   siteVisitOwnerId: { $first: "$siteVisitOwnerId" },
      //   organizationId: { $first: "$organizationId" },
      //   organizationData: { $first: "$organizationData" },
      //   ownerData: { $first: "$ownerData" },
      //   ModifiedBy: { $first: "$ModifiedBy" },
      //   InventoryData: {
      //     $push: "$InventoryData",
      //   }, // Collect the lookup results in the userListData field
      // },
      // },
      {
        $facet: {
          paginatedResult: [{ $skip: skip }, { $limit: parseInt(limit) }],
          totalCount: [{ $count: "count" }],
        },
      },
    ];
    const siteVisitData = await Aggregation("sitevisits", aggregationQuery);
    console.log("siteVisitData===>", siteVisitData);
    if (!siteVisitData[0].paginatedResult.length) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: `Site Visit ${Constant.INFO_MSGS.NO_DATA}`,
      };
      return Response.error(resp);
    }
    const obj = {
      res,
      msg: Constant.INFO_MSGS.SUCCESS,
      status: Constant.STATUS_CODE.OK,
      data: {
        siteVisitData: siteVisitData[0].paginatedResult,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: siteVisitData[0].totalCount[0].count,
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
 * Update siteVisit
 */
const updateSiteVisit = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    const { id } = req.params;
    req.body.ModifiedBy = new ObjectId(userId);
    req.body.organizationId = new ObjectId(organizationId);
    req.body.DueDate = new Date(req.body.DueDate);
    req.body.updatedTime = new Date();
    req.body.siteVisitOwnerId = req.body.siteVisitOwnerId ? new ObjectId(req.body.siteVisitOwnerId) : null;
    // req.body.RelatedTo = ObjectId.isValid(req.body?.RelatedTo) ? new ObjectId(req.body?.RelatedTo) : req.body?.RelatedTo;
    // req.body.ProposedInventory = ObjectId.isValid(req.body?.ProposedInventory) ? new ObjectId(req.body?.ProposedInventory) : req.body?.ProposedInventory;

    req.body.RelatedTo = ObjectId.isValid(req.body?.RelatedTo) ? new ObjectId(req.body?.RelatedTo) : req.body?.RelatedTo;
    req.body.ProposedInventory = ObjectId.isValid(req.body?.ProposedInventory) ? new ObjectId(req.body?.ProposedInventory) : req.body?.ProposedInventory;
    req.body.Host = ObjectId.isValid(req.body?.Host) ? new ObjectId(req.body?.Host) : req.body?.Host;
    // Approval Process Apply
    const sitevisitsData = await FindOne("sitevisits", {
      _id: new ObjectId(id),
    });
    if (sitevisitsData?.ApprovalStatus != "reject" || "approve") {
      const payload = {
        collection: "sitevisits",
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
    await UpdateOne("sitevisits", { _id: new ObjectId(id) }, convertedPayload[0]);
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
    const fileTypeField = await getOnlyTypeFileKeys("siteVisit", organizationId)
    let aggregationQuery = [
      {
        $match: { organizationId: new ObjectId(organizationId) },
      },
      { $project: { numFields: { $size: { $objectToArray: "$$ROOT" } } } },
      { $sort: { numFields: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: "sitevisits",
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
    const siteVisitsData = await Aggregation("sitevisits", aggregationQuery);
    if (siteVisitsData.length == 0) {
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
      data: Object.keys(siteVisitsData[0].FieldsData).filter(item => !fileTypeField.includes(item)),
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
      "sitevisits",
      { _id: { $in: pinArr }, organizationId: new ObjectId(organizationId) },
      { siteVisitOwnerId: new ObjectId(toUserm) }
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
    const listData = await DeleteMany("sitevisits", {
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
      "sitevisits",
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
 * Create Sitevisit By Excel
 */
const addSitevisitExcel = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;

    let IdRegExp = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i;
    var listArr = [];

    for (let i = 0; i < req.body.length; i++) {
      var ResObj = {};

      // const siteVisitOwnerId = req.body[i].siteVisitOwnerId;
      // let ownerIdTest = IdRegExp.test(siteVisitOwnerId);

      // if (_.isUndefined(siteVisitOwnerId) || ownerIdTest == false) {
      //   // //console.log(`Enter if ${i+1}`)
      //   ResObj["raw"] = i + 1;
      //   ResObj["error"] = true;
      //   ResObj["Message"] = "Please Enter siteVisitOwnerId";
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

      req.body[i].siteVisitOwnerId = new ObjectId(userId);
      req.body[i].organizationId = new ObjectId(organizationId);
      req.body[i].createdTime = new Date();
      req.body[i].updatedTime = null;

      if (req.body[i].connectionId) {
        const userInfo = await FindOne("users", {
          _id: new ObjectId(req.body[i].siteVisitOwnerId),
        });

        let data = {
          msg:
            "Site Visit Created By " + userInfo.firstName + userInfo.lastName,
          data: req.body[i],
        };
        TimeLine.insertTimeLine(logger, req.body[i].connectionId, data);

        req.body[i].connectionId = new ObjectId(req.body[i].connectionId);
      } else {
        req.body[i].connectionId = null;
      }
      if (req.body[i].Inventory) {
        req.body[i].Inventory = new ObjectId(req.body[i].Inventory);
      } else {
        req.body[i].Inventory = null;
      }
      if (req.body[i].Participate) {
        req.body[i].Participate = new ObjectId(req.body[i].Participate);
      } else {
        req.body[i].Participate = null;
      }
      // req.body[i].From = new Date(req.body[i].From);
      // req.body[i].To = new Date(req.body[i].To);

      await InsertOne("sitevisits", req.body[i]);
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
  createSiteVisit,
  getSiteVisit,
  getSiteVisitById,
  updateSiteVisit,
  getFilterField,
  getSiteVisitByConnId,
  massTransfer,
  massDelete,
  massUpdate,
  addSitevisitExcel,
};
