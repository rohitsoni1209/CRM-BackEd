const { handleException } = require("../../helpers/exception");
const Response = require("../../helpers/response");
const Constant = require("../../helpers/constant");
const { ObjectId } = require("mongodb");
const { FindOne } = require("../../library/methods");

/**
 * Get Permission By UserId
 */
const checkpermission = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;

    let getUserDetails = await FindOne("users", { _id: new ObjectId(userId) });

    let getUserProfile = await FindOne("permissionProfile", {
      _id: new ObjectId(getUserDetails.profile),
    });

    if (!getUserProfile) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: "Constant.INFO_MSGS.NO_DATA",
      };
      return Response.error(resp);
    }
    const obj = {
      res,
      msg: Constant.INFO_MSGS.SUCCESS,
      status: Constant.STATUS_CODE.OK,
      data: getUserProfile,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};
const checkpermission1 = async (req, res) => {
  const { logger } = req;
  try {
    const resp = {
      status: "test",
      msg: "Constant.INFO_MSGS.NO_DATA",
    };
    return Response.success(resp);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

module.exports = {
  checkpermission,
  checkpermission1,
};
