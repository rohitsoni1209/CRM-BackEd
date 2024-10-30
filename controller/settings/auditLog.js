const bcrypt = require("bcrypt");
const randomString = require("crypto-random-string");
const { handleException } = require("../../helpers/exception");
const Response = require("../../helpers/response");
const Constant = require("../../helpers/constant");
const ProfileValidation = require("../../helpers/joi-validation");
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
 * Get Audit Log
 */
const getAuditLog = async (req, res) => {
    const { logger } = req;
    try {
        const { userId, organizationId } = req.decoded;
        let { offset, limit } = req.body;


        offset = offset || 1;
        limit = limit || 10;
        const skip = limit * (offset - 1);

        let aggregationQuery = [
            {
                $match: { organizationId: new ObjectId(organizationId) }
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
                    let: { userId: "$userId" },
                    from: "users",
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$_id", "$$userId"] },
                            },
                        },
                        { $project: { _id: 1, firstName: 1, lastName: 1 } },
                    ],
                    as: "userData",
                },
            },
            {
                $unwind: {
                    path: "$userData",
                    preserveNullAndEmptyArrays: true,
                },
            },
            { $sort: { createdTime: -1 } },
            {
                $facet: {
                    paginatedResult: [{ $skip: skip }, { $limit: parseInt(limit) }],
                    totalCount: [{ $count: "count" }],
                },
            },
        ];

        const logsInfo = await Aggregation("auditLog", aggregationQuery);
        const obj = {
            res,
            msg: Constant.INFO_MSGS.SUCCESS,
            status: Constant.STATUS_CODE.OK,
            data: {
                data: logsInfo[0].paginatedResult,
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    total: logsInfo[0].totalCount[0].count,
                },
            },
        };
        //console.log(obj);
        return Response.success(obj);
    } catch (error) {
        //console.log("error", error);
        return handleException(logger, res, error);
    }
};
module.exports = {
    getAuditLog,
};