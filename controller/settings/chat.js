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
 * Update Chat
 */
const checkChat = async (req, res) => {
    const { logger } = req;
    try {
        const { userId, organizationId } = req.decoded;
        const userInfo = await FindOne("users", { _id: new ObjectId(userId) });

        if (userInfo && userInfo.chat && userInfo.chat == true) {
            const obj = {
                res,
                msg: Constant.INFO_MSGS.UPDATED_SUCCESSFULLY,
                status: Constant.STATUS_CODE.OK,
                data: {
                    name: userInfo.firstName + ' ' + userInfo.lastName,
                    firstname: userInfo.firstName,
                    lastname: userInfo.lastName,
                    email: userInfo.email.id,
                    orgId: userInfo.organizationId,
                    password: userInfo.chatPassword,
                    chat: true
                }
            };
            return Response.success(obj);
        }

        const chatPassword = randomString({
            length: 15,
            type: "url-safe",
        });

        await UpdateOne("users",
            { _id: new ObjectId(userId) },
            {
                chatPassword,
                chat: true
            });
        // //console.log("abc-->", abc);
        const obj = {
            res,
            msg: Constant.INFO_MSGS.UPDATED_SUCCESSFULLY,
            status: Constant.STATUS_CODE.OK,
            data: {
                name: userInfo.firstName + ' ' + userInfo.lastName,
                firstname: userInfo.firstName,
                lastname: userInfo.lastName,
                email: userInfo.email.id,
                orgId: userInfo.organizationId,
                password: chatPassword,
                chat: false
            }
        };
        return Response.success(obj);
    } catch (error) {
        //console.log("error", error);
        return handleException(logger, res, error);
    }
};
module.exports = {
    checkChat
};