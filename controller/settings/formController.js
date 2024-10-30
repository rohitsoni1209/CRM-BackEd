const bcrypt = require("bcrypt");
const { handleException } = require("../../helpers/exception");
const Response = require("../../helpers/response");
const Constant = require("../../helpers/constant");
const ProfileValidation = require("../../helpers/joi-validation");
const { ObjectId } = require("mongodb");
const mongodb = require("mongodb");
const _ = require("underscore");
const {
  FindAll,
  Find,
  Insert,
  InsertOne,
  TotalCount,
  Aggregation,
  UpdateOne,
  FindOne,
  Count,
} = require("../../library/methods");
/**
 * Create form
 */
const createForm = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    req.body.FormsOwnerId = new ObjectId(req.body.FormsOwnerId);
    req.body.organizationId = new ObjectId(organizationId);
    req.body.createdTime = new Date();
    req.body.updatedTime = new Date();

    // const formsInfo = await FindOne("forms", {
    //   formTitle: req.body.formTitle,
    //   organizationId,
    // });
    // if (formsInfo) {
    //   const resp = {
    //     res,
    //     status: Constant.STATUS_CODE.BAD_REQUEST,
    //     msg: Constant.ERROR_MSGS.FORM_EXISTS,
    //   };
    //   return Response.error(resp);
    // }

    // Create forms
    await InsertOne("forms", req.body);
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
 * Get form
 */
const getForm = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId, role } = req.decoded;
    let { sortBy, offset, limit, formTitle } = req.query;

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

    matchCondition.formTitle = formTitle;
    matchCondition.organizationId = new ObjectId(organizationId);
    matchCondition.FormsOwnerId = new ObjectId(userId);
    if (orCondition.length) {
      matchCondition = { ...matchCondition, $or: orCondition };
    }

    console.log("matchCondition", JSON.stringify(matchCondition));
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
          let: { ownerId: "$FormsOwnerId" },
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

    const formData = await Aggregation("forms", aggregationQuery);
    if (!formData[0].paginatedResult.length) {
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
        formData: formData[0].paginatedResult,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: formData[0].totalCount[0].count,
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
 * Get Form Group
 */
const getFormGroup = async (req, res) => {
  const { logger } = req;
  try {
    const { organizationId } = req.decoded;
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
          let: { ownerId: "$FormsOwnerId" },
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
        $group: {
          _id: "$formTitle",
        },
      },
      {
        $sort: { _id: -1 },
      },
      {
        $facet: {
          paginatedResult: [{ $skip: skip }, { $limit: parseInt(limit) }],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const formData = await Aggregation("forms", aggregationQuery);
    if (!formData[0].paginatedResult.length) {
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
        formData: formData[0].paginatedResult,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: formData[0].totalCount[0].count,
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
 * get By id form
 */
const getFormById = async (req, res) => {
  const { logger } = req;
  try {
    const { id } = req.params;
    const { userId, organizationId } = req.decoded;
    // Create form
    const formData = await FindOne("forms", { _id: new ObjectId(id) });

    if (!formData) {
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
      data: formData,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

/**
 * Update form
 */
const updateForm = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    const { id } = req.params;
    req.body.ModifiedBy = new ObjectId(userId);
    req.body.organizationId = new ObjectId(organizationId);
    req.body.updatedTime = new Date();
    req.body.FormsOwnerId = new ObjectId(userId);
    await UpdateOne("forms", { _id: new ObjectId(id) }, req.body);
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
 * get By id form
 */
const getByFormName = async (req, res) => {
  const { logger } = req;
  try {
    const { formTitle } = req.params;
    const { userId, organizationId, role } = req.decoded;
    // Create form
    const formData = await FindOne("forms", {
      organizationId: new ObjectId(organizationId),
      FormsOwnerId: new ObjectId(userId),
      formTitle,
    });

    if (!formData) {
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
      data: formData,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};
const getByAllFormName = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId, role } = req.decoded;
    const isCEO = role === "CEO";

    const organizationObjId = new ObjectId(organizationId);
    const userObjId = new ObjectId(userId);

    const matchCondition = { organizationId: organizationObjId };
    const matchConditionDeals = { organizationId: organizationObjId};
    const matchConditionCalls = { organizationId: organizationObjId };
    const matchConditionMeetings = { organizationId: organizationObjId };
    const matchConditionSiteVisit = { organizationId: organizationObjId };
    const matchConditionInventory = { organizationId: organizationObjId };
    const matchConditionSaleOrders = { organizationId: organizationObjId };
    const matchConditionPurchaseOrders = { organizationId: organizationObjId };
    const matchConditionInvoices = { organizationId: organizationObjId };
    const matchConditionVendor = { organizationId: organizationObjId };

    if (!isCEO) {
      matchCondition["LeadsOwnerId"] = userObjId;
      matchConditionDeals["OpportunitiesOwnerId"] = userObjId;
      matchConditionCalls["CallsOwnerId"] = userObjId;
      matchConditionMeetings["MeetingOwnerId"] = userObjId;
      matchConditionSiteVisit["siteVisitOwnerId"] = userObjId;
      matchConditionInventory["InventoryOwnerId"] = userObjId;
      matchConditionSaleOrders["SalesOrderOwnerId"] = userObjId;
      matchConditionPurchaseOrders["PurchaseOrdersOwnerId"] = userObjId;
      matchConditionInvoices["InvoicesOwnerId"] = userObjId;
      matchConditionVendor["VendorOwnerId"] = userObjId;
    }

    const leadsFilter = {
      ...matchCondition,
      status: { $ne: 0 },
    };

    const fromData1 = await TotalCount("leads", leadsFilter);
    const fromData3 = await TotalCount("deals", matchConditionDeals);
    const fromData4 = await TotalCount("inventory", matchConditionInventory);
    const fromData5 = await TotalCount("saleOrders", matchConditionSaleOrders);
    const fromData6 = await TotalCount("purchaseOrders", matchConditionPurchaseOrders);
    const fromData7 = await TotalCount("invoices", matchConditionInvoices);
    const fromData8 = await TotalCount("vendor", matchConditionVendor);

    const currentDate = new Date();
    const pastDate = new Date();
    pastDate.setDate(currentDate.getDate() - 3);
    currentDate.setDate(currentDate.getDate() + 1);

    const endDate = currentDate.toISOString();
    const startDate = pastDate.toISOString();

    const callFilter = {
      ...matchConditionCalls,
      CallStartTime: {
      '$gte': new Date(startDate),
      '$lte': new Date(endDate),
      },
    };

    const fromDataCallsCount = await TotalCount("calls", callFilter);
    const meetingFilter = {
      ...matchConditionMeetings,
      MeetingStartTime: {
        '$gte': new Date(startDate),
        '$lte': new Date(endDate),
      },
    };

    console.log("meetingFilter", meetingFilter)
    const siteVisitFilter = {
      ...matchConditionSiteVisit,
      SiteVisitStartTime: {
      '$gte': new Date(startDate),
      '$lte': new Date(endDate),
      },
    };
    console.log("meetingFilterSiteVisit", siteVisitFilter)
    const fromDataMeetingsCount = await TotalCount("meetings", meetingFilter);
    const fromDataSiteVisits = await TotalCount("sitevisits", siteVisitFilter);

    const fromDataLeadsPendingAction = await FindAll("leads", leadsFilter);
    const leadsCount = await calculatePendingActions(fromDataLeadsPendingAction);
    matchConditionDeals.tuch = true;
    const fromDataDealsPendingAction = await FindAll("deals", matchConditionDeals);
    const dealsCount = await calculatePendingActions(fromDataDealsPendingAction);

    const result = {
      leads: fromData1,
      deals: fromData3,
      inventory: fromData4,
      saleOrders: fromData5,
      purchaseOrders: fromData6,
      invoices: fromData7,
      vendor: fromData8,
      call: fromDataCallsCount,
      meeting: fromDataMeetingsCount,
      sitevisit: fromDataSiteVisits,
      leadsPendingAction: leadsCount,
      dealsPendingAction: dealsCount,
    };

    const responseObj = {
      res,
      msg: Constant.INFO_MSGS.SUCCESS,
      status: Constant.STATUS_CODE.OK,
      data: result,
    };
    return Response.success(responseObj);
  } catch (error) {
    console.log("Error", error)
    return handleException(logger, res, error);
  }
};

// const getByAllFormName = async (req, res) => {
//   const { logger } = req;
//   try {
//     const { userId, organizationId, role } = req.decoded;
//     const matchCondition = { organizationId: new ObjectId(organizationId) };
//     if (role !== "CEO") {
//       matchCondition["LeadsOwnerId"] = new ObjectId(userId);
//     }
//     const fromData1 = await TotalCount("leads", {
//       LeadsOwnerId: new ObjectId(userId),
//       status: { $ne: 0 },
//     });

//     const fromData3 = await TotalCount("deals", matchCondition);

//     const currentDate = new Date();
//     const pastDate = new Date();
//     pastDate.setDate(currentDate.getDate() - 3);
//     currentDate.setDate(currentDate.getDate() + 1);

//     const endDate = currentDate.toISOString();
//     const startDate = pastDate.toISOString();

//     const callFilter = {
//       organizationId: new ObjectId(organizationId),
//       CallStartTime: {
//         '$gte': new Date(startDate),
//         '$lte': new Date(endDate)
//       },
//     };

//     const fromDataCalls = await TotalCount("calls", callFilter);
//     const fromDataCallsCount = await TotalCount("calls", matchCondition);

//     const meetingFilter = {
//       organizationId: new ObjectId(organizationId),
//       From: {
//         '$gte': new Date(startDate),
//         '$lte': new Date(endDate)
//       },
//     };

//     const fromDataMeetings = await TotalCount("meetings", meetingFilter);
//     const fromDataMeetingsCount = await TotalCount("meetings", matchCondition);

//     const fromDataSiteVisits = await TotalCount("sitevisits", meetingFilter);

//     const fromDataLeadsPendingAction = await FindAll("leads", {
//       ...matchCondition,
//       status: { '$ne': 0 },
//     });

//     const leadsCount = await calculatePendingActions(fromDataLeadsPendingAction);

//     const fromDataDealsPendingAction = await FindAll("deals", matchCondition);
//     const dealsCount = await calculatePendingActions(fromDataDealsPendingAction);

//     const result = {
//       leads: fromData1,
//       deals: fromData3,
//       call: fromDataCallsCount,
//       meeting: fromDataMeetingsCount,
//       sitevisit: fromDataSiteVisits,
//       leadsPendingAction: leadsCount,
//       dealsPendingAction: dealsCount,
//     };

//     const responseObj = {
//       res,
//       msg: Constant.INFO_MSGS.SUCCESS,
//       status: Constant.STATUS_CODE.OK,
//       data: result,
//     };
//     return Response.success(responseObj);
//   } catch (error) {
//     return handleException(logger, res, error);
//   }
// };

const calculatePendingActions = async (data) => {
  let count = 0;
  // console.log("data", data) 
  for (const item of data) {
    const infoData = await Find('timeline', { connectionId: new ObjectId(item?._id) }, 0, 1, { createdTime: -1 });
    let flag = false;
    const presentDate = formatDate(new Date());
    if (infoData?.length > 0) {
      for (const info of infoData) {
        switch (info?.data?.data?.ModuleTitle) {
          case "Calls":
            if (info?.data?.data?.CallStartTime >= presentDate || info?.data?.data?.OutgoingCallStatus === "Scheduled") {
              count++;
              flag = true;
            }
            break;
          case "Meetings":
            if (info?.data?.data?.MeetingStartTime >= presentDate) {
              count++;
              flag = true;
            }
            break;
          case "Tasks":
            if (info?.data?.data?.ClosedTime >= presentDate) {
              count++;
              flag = true;
            }
            break;
        }
        if (flag) break;
      }
    } else {
      count++;
    }
  }

  return count;
};


const getOnlyTypeFileKeys = async (form, organizationId) => {
  const fromData = await FindOne("forms", {
    organizationId: new ObjectId(organizationId),
    formTitle: form,
  });
  return fromData?.sections?.map((forms) => {
    const data = forms.inputs;
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const item = data[key];
        if (item.type === "file") {
          return item.value;
        }
      }
    }
  });
};

module.exports = {
  createForm,
  getForm,
  getFormGroup,
  getFormById,
  updateForm,
  getByFormName,
  getByAllFormName,
  getOnlyTypeFileKeys,
};
