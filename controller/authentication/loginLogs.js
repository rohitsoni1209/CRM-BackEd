const Response = require("../../helpers/response");
const Constant = require("../../helpers/constant");
const { handleException } = require("../../helpers/exception");
const { FindOne, Aggregation } = require("../../library/methods");
const ObjectId = require("mongodb").ObjectId;

/**
 * Get LOGIN-LOG
 * Auth-Role - CEO
 */

const getLoginLogs = async (req, res) => {
  const { logger } = req;
  try {
    //console.log(req.decoded);
    const { organizationId, userId } = req.decoded;
    let { sortBy, offset, limit } = req.query;

    // const userInfo = await FindOne("users", { _id: new ObjectId(userId) });
    // //console.log("userInfo-->", userInfo);

    // if (userInfo.roleTitle !== "CEO") {
    //   const resp = {
    //     res,
    //     status: Constant.STATUS_CODE.UN_AUTHORIZED,
    //     msg: Constant.ERROR_MSGS.UN_AUTHORIZED,
    //   };
    //   return Response.error(resp);
    // }

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
          let: { ownerId: "$userId" },
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
        $facet: {
          paginatedResult: [{ $skip: skip }, { $limit: parseInt(limit) }],
          totalCount: [{ $count: "count" }],
        },
      },
    ];
    const loginLogData = await Aggregation("loginLog", aggregationQuery);
    if (!loginLogData[0].paginatedResult.length) {
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
        loginLogData: loginLogData[0].paginatedResult,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: loginLogData[0].totalCount[0].count,
        },
      },
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

module.exports = {
  getLoginLogs,
};
