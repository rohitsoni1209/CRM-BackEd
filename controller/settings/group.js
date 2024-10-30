const { handleException } = require("../../helpers/exception");
const Response = require("../../helpers/response");
const Constant = require("../../helpers/constant");
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
} = require("../../library/methods");
/**
 * Create Group
 */
const createGroup = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    const { userList } = req.body;

    req.body.GroupsOwnerId = new ObjectId(req.body.GroupsOwnerId);
    req.body.organizationId = new ObjectId(organizationId);
    req.body.createdTime = new Date();
    req.body.updatedTime = new Date();

    const groupInfo = await FindOne("group", {
      groupTitle: req.body.groupTitle,
      organizationId,
    });
    if (groupInfo) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.ERROR_MSGS.GROUP_EXISTS,
      };
      return Response.error(resp);
    }

    req.body.userList = userList.map((e) => (e = new ObjectId(e)));

    // Create Group
    const saveGroup = await InsertOne("group", req.body);
    //console.log("saveGroup", saveGroup);

    // assign Group To users
    for (let i = 0; i < userList.length; i++) {
      await UpdateOne(
        "users",
        { _id: new ObjectId(userList[i]) },
        { groupId: saveGroup.insertedId }
      );
    }

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
 * Get Group
 */
const getGroup = async (req, res) => {
  const { logger } = req;
  try {
    const { organizationId } = req.decoded;
    // //console.log("organizationId", organizationId);
    // //console.log("Decoded-->", req.decoded);
    let { sortBy, offset, limit } = req.query;

    let queryObj = req.query;
    delete queryObj.offset;
    delete queryObj.sortBy;
    delete queryObj.limit;
    let queryObjKeys = Object.keys(queryObj);
    const orCondition = [];

    // //console.log("queryObjKeys", queryObjKeys);

    for (let key of queryObjKeys) {
      orCondition.push({ [key]: { $regex: queryObj[key], $options: "i" } });
    }

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

    // //console.log("matchCondition-->", matchCondition);
    // //console.log("orCondition-->", orCondition);

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
          let: { ownerId: "$GroupsOwnerId" },
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
          path: "$userList",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userList",
          foreignField: "_id",
          as: "userData",
        },
      },
      {
        $unwind: {
          path: "$userData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$_id",
          groupTitle: { $first: "$groupTitle" },
          description: { $first: "$description" },
          organizationData: { $first: "$organizationData" },
          ownerData: { $first: "$ownerData" },
          ModifiedBy: { $first: "$ModifiedBy" },
          userListData: {
            $push: {
              _id: "$userData._id",
              firstName: "$userData.firstName",
              lastName: "$userData.lastName",
              email: "$userData.email.id",
            },
          }, // Collect the lookup results in the userListData field
        },
      },
      {
        $facet: {
          paginatedResult: [{ $skip: skip }, { $limit: parseInt(limit) }],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const groupData = await Aggregation("group", aggregationQuery);
    if (!groupData[0].paginatedResult.length) {
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
        groupData: groupData[0].paginatedResult,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: groupData[0].totalCount[0].count,
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
 * get By id Group
 */
const getGroupById = async (req, res) => {
  const { logger } = req;
  try {
    const { id } = req.params;

    const groupData = await FindOne("group", { _id: new ObjectId(id) });

    if (!groupData) {
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
      data: groupData,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

/**
 * Update Group
 */
const updateGroup = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    const { id } = req.params;
    const { userList } = req.body;
    req.body.ModifiedBy = new ObjectId(userId);
    req.body.organizationId = new ObjectId(organizationId);
    req.body.updatedTime = new Date();
    req.body.userList = userList.map((e) => (e = new ObjectId(e)));

    await UpdateOne("group", { _id: new ObjectId(id) }, req.body);
    const findGroup = await FindOne("group", { _id: new ObjectId(id) });

    // assign Group To users
    for (let i = 0; i < userList.length; i++) {
      await UpdateOne(
        "users",
        { _id: new ObjectId(userList[i]) },
        { groupId: findGroup._id }
      );
    }
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

module.exports = {
  createGroup,
  getGroup,
  getGroupById,
  updateGroup,
};
