const { handleException } = require("../../helpers/exception");
const Response = require("../../helpers/response");
const Constant = require("../../helpers/constant");
const { ObjectId } = require("mongodb");
const _ = require("underscore");
const {
  returnFilterByFieldQuery,
  returnFilterButton,
} = require("../../utility/filter");
const {
  Find,
  Insert,
  InsertOne,
  Aggregation,
  UpdateOne,
  FindOne,
  Count,
} = require("../../library/methods");
/**
 * Create KanbanView if not exist otherwise insert New Document
 */
const createKanbanView = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    const { userList } = req.body;

    req.body.KanbanViewsOwnerId = new ObjectId(userId);
    req.body.organizationId = new ObjectId(organizationId);
    req.body.createdTime = new Date();
    req.body.updatedTime = new Date();

    const kanbanviewInfo = await FindOne("kanbanview", {
      ModuleName: req.body.ModuleName,
      organizationId,
    });
    if (kanbanviewInfo) {
      await UpdateOne(
        "kanbanview",
        { _id: new ObjectId(kanbanviewInfo._id) },
        req.body
      );
      const obj = {
        res,
        msg: Constant.INFO_MSGS.SUCCESS,
        status: Constant.STATUS_CODE.OK,
      };
      return Response.success(obj);
    }

    // Create kanbanview
    await InsertOne("kanbanview", req.body);

    const obj = {
      res,
      msg: Constant.INFO_MSGS.SUCCESS,
      status: Constant.STATUS_CODE.OK,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

/**
 * Get KanbanView
 */
const getKanbanView = async (req, res) => {
  const { logger } = req;
  try {
    const { organizationId, userId } = req.decoded;
    let { sortBy, offset, limit, str, ModuleName } = req.query;

    let queryObj = req.query;
    delete queryObj.offset;
    delete queryObj.sortBy;
    delete queryObj.limit;
    delete queryObj.ModuleName;
    delete queryObj.str;
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

    if (ModuleName) {
      orCondition.push({ ModuleName: { $regex: ModuleName, $options: "i" } });
    }
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
          let: { ownerId: "$KanbanViewsOwnerId" },
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
    const kanbanviewData = await Aggregation("kanbanview", aggregationQuery);
    if (!kanbanviewData[0].paginatedResult.length) {
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
        kanbanviewData: kanbanviewData[0].paginatedResult,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: kanbanviewData[0].totalCount[0].count,
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
 * Filtered KanbanView
 */
const FilteredKanbanView = async (req, res) => {
  const { logger } = req;
  try {
    const { organizationId, userId, role } = req.decoded;
    let { ModuleName } = req.query;

    if (!ModuleName) {
      const obj = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: `ModuleName ${Constant.INFO_MSGS.MSG_REQUIRED} in query params `,
      };
      return Response.error(obj);
    }
    let matchKanbanView = {
      ModuleName,
      organizationId: new ObjectId(organizationId),
      KanbanViewsOwnerId: new ObjectId(userId)
    };
    // if (role == 'CEO') {
    //   matchKanbanView = {
    //     ...matchKanbanView,
    //   };
    // } else {
    //   matchKanbanView = {
    //     ...matchKanbanView,
    //     KanbanViewsOwnerId: new ObjectId(userId),
    //   };
    // }
    const existData = await FindOne('kanbanview', matchKanbanView)
    if (!existData) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.INFO_MSGS.NO_DATA,
      };
      return Response.error(resp);
    }

    const CategorizeBy = existData.CategorizeBy

    // const AggregateBy = existData.AggregateBy
    // const collectionName = existData.ModuleName
    // const collectionName2 = collectionName.toLowerCase()

    let matchCondition = {};
    if (role == 'CEO') {
      matchCondition.organizationId = new ObjectId(organizationId);
    } else {
      matchCondition.LeadsOwnerId = new ObjectId(userId);
    }
    let aggregationQuery = [
      {
        $match: matchCondition,
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
        $sort: { createdTime: -1 },
      },
    ];
    console.log("CategorizeBy", JSON.stringify(aggregationQuery, null, 4))
    const ModuleExistData = await Aggregation(existData.ModuleName, aggregationQuery);

    // const ModuleExistData = await Find(existData.ModuleName,{organizationId:new ObjectId(organizationId)})
    // //console.log("ModuleExistData", ModuleExistData)

    const keyName = CategorizeBy;
    let objectsWithKeyName = {}
    // if (keyName === "Industry") {
    //   objectsWithKeyName = ModuleExistData
    // } else {
    objectsWithKeyName = await ModuleExistData.filter(obj => keyName in obj);
    //}


    if (objectsWithKeyName.length == 0) {
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
      data: objectsWithKeyName,
    };
    // //console.log("tessss===>2222obj", JSON.stringify(obj))

    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

module.exports = {
  createKanbanView,
  getKanbanView,
  FilteredKanbanView,
};
