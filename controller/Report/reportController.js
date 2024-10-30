const { handleException } = require("../../helpers/exception");
const Response = require("../../helpers/response");
const Constant = require("../../helpers/constant");
const { ObjectId } = require("mongodb");
const {
    InsertOne,
    Aggregation,
    UpdateOne,
    FindOne,
    DeleteMany,
    PermanentDelete,
    Find,
} = require("../../library/methods");
const tableFolder = "folders";
const tableReports = 'reports';

/**
 * Create Report
 */
const createReport = async (req, res) => {
    const { logger } = req;
    try {
        const { userId, organizationId } = req.decoded;
        const { name, description = null, folderId = '', reportModules } = req.body;
        // let IdRegExp = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i;
        if (!reportModules || !name) {
            const resp = {
                res,
                status: Constant.STATUS_CODE.BAD_REQUEST,
                msg: "Name and report connection required!",
            };
            return Response.error(resp);
        }
        if (!Array.isArray(reportModules) || !reportModules.length) {
            const resp = {
                res,
                status: Constant.STATUS_CODE.BAD_REQUEST,
                msg: "Not Valid Report Connections",
            };
            return Response.error(resp);
        }

        req.body.organizationId = new ObjectId(organizationId);
        req.body.name = name;
        req.body.description = description;
        req.body.folderId = folderId ? new ObjectId(folderId) : '';
        req.body.reportModules = reportModules;
        req.body.createdBy = new ObjectId(userId);
        req.body.createdTime = new Date();
        req.body.updatedTime = null;

        // Create reports
        let reportData = await InsertOne(tableReports, req.body);
        const obj = {
            res,
            msg: Constant.INFO_MSGS.CREATED_SUCCESSFULLY,
            status: Constant.STATUS_CODE.CREATED,
            data: {
                _id: reportData.insertedId
            }
        };
        return Response.success(obj);
    } catch (error) {
        //console.log("error", error);
        return handleException(logger, res, error);
    }
};

/**
 * Edit Report
 */
const editReport = async (req, res) => {
    const { logger } = req;
    try {
        const { userId, organizationId } = req.decoded;
        const { reportId, name, description, folderId, reportModules } = req.body;
        let IdRegExp = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i;
        if (!IdRegExp.test(reportId)) {
            const resp = {
                res,
                status: Constant.STATUS_CODE.BAD_REQUEST,
                msg: "reportId is not Valid!",
            };
            return Response.error(resp);

        }

        const dataFromBody = { name, description, folderId, reportModules };
        const dataToUpdate = {};
        for (let key of Object.keys(dataFromBody)) {
            if (dataFromBody[key]) {
                dataToUpdate[key] = dataFromBody[key];
            }
        }

        // Updated reports
        await UpdateOne(tableReports, { _id: new ObjectId(reportId), createdBy: new ObjectId(userId), organizationId: new ObjectId(organizationId) }, dataToUpdate);
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
 * Delete Reports
 */

const deleteReport = async (req, res) => {
    const { logger } = req;
    try {
        const { userId, organizationId } = req.decoded;
        const { reportIds } = req.body;
        let IdRegExp = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i;

        for (let reportId of reportIds) {
            if (!IdRegExp.test(reportId)) {
                const resp = {
                    res,
                    status: Constant.STATUS_CODE.BAD_REQUEST,
                    msg: "reportId is not Valid!",
                };
                return Response.error(resp);
            }
        }

        const ids = reportIds.map((id) => new ObjectId(id));
        // delete reports
        await DeleteMany(tableReports, { _id: { $in: ids } });
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
 * Get Report
 */
const generateReport = async (req, res) => {
    const { logger } = req;
    try {
        const { organizationId, userId } = req.decoded;

        let { reportId, isMultiSelect } = req.query;

        if (!reportId) {
            const resp = {
                res,
                status: Constant.STATUS_CODE.BAD_REQUEST,
                msg: "Not Valid ReportId!",
            };
            return Response.error(resp);

        }
        matchCondition = {};
        matchCondition._id = new ObjectId(reportId);
        matchCondition.organizationId = new ObjectId(organizationId);
        matchCondition.createdBy = new ObjectId(userId);

        const reportInfo = await FindOne(tableReports, { _id: new ObjectId(reportId) })

        if (!reportInfo) {
            const resp = {
                res,
                status: Constant.STATUS_CODE.NO_CONTENT,
                msg: "No Such Report Exists!",
            };
            return Response.error(resp);
        }

        let lookup = reportInfo.reportModules.map((moduleName, index) => {
            //console.log(moduleName);
            if (index === 0) {
                if (moduleName != null) {

                    return [
                        {
                            $lookup: {
                                from: moduleName.toLowerCase(),
                                as: `linked${moduleName}`,
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: { $eq: ["$organizationId", organizationId] }
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $unwind: `$linked${moduleName}`,
                        }
                    ]
                }
            }
            // //console.log(reportInfo.isMultiSelect);
            if (reportInfo.isMultiSelect) {
                return [
                    {
                        $lookup: {
                            from: moduleName.toLowerCase(),
                            let: {
                                connectionId: `$linked${reportInfo.reportModules[0]}._id`
                            },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                {
                                                    $eq: ["$organizationId", organizationId]
                                                },
                                                {
                                                    $eq: ["$connectionId", "$$connectionId"]
                                                }
                                            ]
                                        }
                                    }
                                }
                            ],
                            as: `linked${moduleName}`,
                        }
                    },
                    // {
                    //     $unwind: `$linked${moduleName}`
                    // }
                ]
            } else {
                if (moduleName != null) {
                    return [
                        {
                            $lookup: {
                                from: moduleName.toLowerCase(),
                                let: {
                                    connectionId: `$linked${reportInfo.reportModules[index - 1]}._id`
                                },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    {
                                                        $eq: ["$organizationId", organizationId]
                                                    },
                                                    {
                                                        $eq: ["$connectionId", "$$connectionId"]
                                                    }
                                                ]
                                            }
                                        }
                                    }
                                ],
                                as: `linked${moduleName}`,
                            }
                        },
                        // {
                        //     $unwind: `$linked${moduleName}`
                        // }
                    ]
                }
            }
        })
        lookup = [].concat(...lookup);
        // //console.log('lookup',lookup)
        let aggregationQuery = [
            {
                $match: matchCondition,
            },
            ...lookup,
            {
                $limit: 100
            }
        ];


        const report_data = await Aggregation(tableReports, aggregationQuery);

        if (!report_data) {
            const resp = {
                res,
                status: Constant.STATUS_CODE.NO_CONTENT,
                msg: Constant.INFO_MSGS.NO_DATA,
            };
            return Response.error(resp);
        }

        const obj = {
            res,
            msg: Constant.INFO_MSGS.SUCCESS,
            status: Constant.STATUS_CODE.OK,
            data: report_data,
        };
        return Response.success(obj);

    } catch (error) {
        //console.log("error", error);
        return handleException(logger, res, error);
    }
};

/**
 * Create Report Folder
 */
const createReportFolder = async (req, res) => {
    const { logger } = req;
    try {
        const { userId, organizationId } = req.decoded;
        const { name, description, createdAt = new Date().getTime(), updatedAt = new Date().getTime() } = req.body;

        let IdRegExp = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i;

        if (!IdRegExp.test(organizationId) || !IdRegExp.test(userId)) {
            const resp = {
                res,
                status: Constant.STATUS_CODE.BAD_REQUEST,
                msg: "Token Malformed/Altered",
            };
            return Response.error(resp);
        }

        if (!name || !description) {
            const resp = {
                res,
                status: Constant.STATUS_CODE.BAD_REQUEST,
                msg: "Name And Description of folder is Mandatory!",
            };
            return Response.error(resp);
        }

        const dataToInsert = {
            name,
            description,
            createdBy: new ObjectId(userId),
            organizationId: new ObjectId(organizationId),
            createdAt,
            updatedAt,
        }

        await InsertOne(tableFolder, dataToInsert);
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
}


/**
 * Delete A folder
 */
const deleteFolder = async (req, res) => {
    const { logger } = req;
    try {
        const { userId, organizationId } = req.decoded;
        const { folderId } = req.body;
        let IdRegExp = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i;

        if (!IdRegExp.test(folderId)) {
            const resp = {
                res,
                status: Constant.STATUS_CODE.BAD_REQUEST,
                msg: "folderId is not Valid!",
            };
            return Response.error(resp);
        }

        // delete a folder
        await PermanentDelete(tableFolder, { _id: new ObjectId(folderId) });
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
 * Rename Report Folder
 */
const renameReportFolder = async (req, res) => {
    const { logger } = req;
    try {
        const { userId, organizationId } = req.decoded;
        const { name, description, updatedAt = new Date().getTime(), folderId } = req.body;

        let IdRegExp = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i;

        if (!IdRegExp.test(organizationId) || !IdRegExp.test(userId)) {
            const resp = {
                res,
                status: Constant.STATUS_CODE.BAD_REQUEST,
                msg: "Token Malformed/Altered",
            };
            return Response.error(resp);
        }

        if (!name || !IdRegExp.test(folderId)) {
            const resp = {
                res,
                status: Constant.STATUS_CODE.BAD_REQUEST,
                msg: "Name And FolderId of folder is Mandatory!",
            };
            return Response.error(resp);
        }

        const condition = {
            _id: new ObjectId(folderId),
            createdBy: new ObjectId(userId),
            organizationId: new ObjectId(organizationId),
        }

        await UpdateOne(tableFolder, condition, { name, updatedAt, description });
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

}

/**
 * get Modules
 */
const getModules = async (req, res) => {
    const { logger } = req;
    try {
        const { organizationId } = req.decoded;

        let { moduleName } = req.query;

        matchCondition = {
        };
        matchCondition.organizationId = new ObjectId(organizationId);

        let aggregationQuery = [
            {
                $match: matchCondition,
            },
            {
                $unwind: "$sections"
            },
            {
                $addFields: {
                    lookupInputs: {
                        $filter: {
                            input: {
                                $objectToArray: "$sections.inputs"
                            },
                            as: "input",
                            cond: {
                                $and: [
                                    { $eq: ["$$input.v.type", "Lookup"] },
                                    { $eq: ["$$input.v.lookupModule", moduleName] }
                                ]
                            }
                        }
                    }
                }
            },
            {
                $match: {
                    "lookupInputs": { $ne: [] }
                }
            },
            {
                $project: {
                    _id: 1,
                    formTitle: 1,
                    // lookupInputs: 1
                }
            }
        ];
        const formData = await Aggregation("forms", aggregationQuery);
        if (!formData.length) {
            const resp = {
                res,
                status: Constant.STATUS_CODE.NO_CONTENT,
                msg: Constant.INFO_MSGS.NO_DATA,
            };
            return Response.error(resp);
        }
        //console.log('formdata', formData)
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
}


/**
 * get folder and reports
*/

const getFolderAndReport = async (req, res) => {
    const { logger } = req;
    try {
        const { userId, organizationId } = req.decoded;

        let { folderId, offset = 1, limit = 20 } = req.query;
        offset = parseInt(offset);
        limit = parseInt(limit);

        const skip = limit * (offset - 1);

        matchCondition = {
            organizationId: new ObjectId(organizationId),
            createdBy: new ObjectId(userId)
        };
        let aggregationQuery = [];
        if (folderId) {
            matchCondition._id = new ObjectId(folderId);
        }
        aggregationQuery = [
            {
                $match: matchCondition,
            }
        ]
        if (folderId) {
            aggregationQuery = [
                ...aggregationQuery,
                {
                    $lookup: {
                        from: tableReports,
                        localField: "_id",
                        foreignField: "folderId",
                        as: "report"
                    }
                },
                {
                    $unwind: "$report"
                },
                {
                    $skip: skip
                },
                {
                    $limit: limit
                },
                {
                    $project: {
                        _id: "$report._id",
                        folderId: "$_id",
                        folderName: "$name",
                        folderDescription: "$description",
                        reportId: "$report._id",
                        reportName: "$report.name",
                        reportDescription: "$report.description",
                        reportModules: "$report.reportModules"
                    }
                },
            ]
        } else {
            aggregationQuery = [
                ...aggregationQuery,
                {
                    $skip: skip
                },
                {
                    $limit: limit
                },
                {
                    $project: {
                        folderId: "$_id",
                        folderName: "$name",
                        folderDescription: "$description",
                    }
                },
            ]
        }

        const folderData = await Aggregation(tableFolder, aggregationQuery);
        if (!folderData.length) {
            const resp = {
                res,
                status: Constant.STATUS_CODE.NO_CONTENT,
                msg: Constant.INFO_MSGS.NO_DATA,
            };
            return Response.error(resp);
        }
        const obj = {
            res,
            msg: Constant.INFO_MSGS.SUCCESS,
            status: Constant.STATUS_CODE.OK,
            data: folderData,
        };
        return Response.success(obj);
    } catch (error) {
        //console.log("error", error);
        return handleException(logger, res, error);
    }

}


/*
* Get All Reports
*/
const getAllReports = async (req, res) => {
    const { logger } = req;
    try {
        const { userId, organizationId } = req.decoded;

        let { offset = 1, limit = 20, reportId } = req.query;

        offset = parseInt(offset);
        limit = parseInt(limit);

        const skip = limit * (offset - 1);

        if (reportId) {
            const report = await FindOne(tableReports, { createdBy: new ObjectId(userId), organizationId: new ObjectId(organizationId), _id: new ObjectId(reportId) });
            if (!report) {
                const obj = {
                    res,
                    msg: Constant.INFO_MSGS.NO_DATA,
                    status: Constant.STATUS_CODE.NO_CONTENT,
                    // data: reports
                };
                return Response.success(obj);

            }
            const obj = {
                res,
                msg: Constant.INFO_MSGS.SUCCESS,
                status: Constant.STATUS_CODE.OK,
                data: report
            };
            return Response.success(obj);

        }
        // Get All Reports
        const reports = await Find(tableReports, { createdBy: new ObjectId(userId), organizationId: new ObjectId(organizationId) }, skip, limit);
        if (!reports || !reports.length) {
            const obj = {
                res,
                msg: Constant.INFO_MSGS.NO_DATA,
                status: Constant.STATUS_CODE.NO_CONTENT,
                // data: reports
            };
            return Response.success(obj);

        }
        const obj = {
            res,
            msg: Constant.INFO_MSGS.SUCCESS,
            status: Constant.STATUS_CODE.OK,
            data: reports
        };
        return Response.success(obj);
    } catch (error) {
        //console.log("error", error);
        return handleException(logger, res, error);
    }
}


module.exports = {
    createReport,
    editReport,
    deleteReport,
    generateReport,
    createReportFolder,
    renameReportFolder,
    deleteFolder,
    getModules,
    getFolderAndReport,
    getAllReports
};
