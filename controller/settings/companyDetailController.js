const bcrypt = require("bcrypt");
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
 * Get CompanyDetails
 */
const getCompanyDetails = async (req, res) => {
  const { logger } = req;
  try {
    let getCompanyDetails = await Find("organization");

    if (getCompanyDetails.length > 0) {
      const obj = {
        res,
        msg: Constant.INFO_MSGS.SUCCESS,
        status: Constant.STATUS_CODE.OK,
        data: getCompanyDetails,
      };
      return Response.success(obj);
    } else {
      const obj = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.INFO_MSGS.NO_DATA,
      };
      return Response.error(obj);
    }
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

/**
 * get By id CompanyDetails
 */
const getCompanyDetailsById = async (req, res) => {
  const { logger } = req;
  try {
    const { id } = req.params;
    const { userId, organizationId } = req.decoded;
    // Get Company Data
    const CompanyData = await FindOne("organization", {
      _id: new ObjectId(organizationId),
    });

    if (!CompanyData) {
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
      data: CompanyData,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

/**
 * Update CompanyDetails
 */
const updateCompanyDetails = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    const { id } = req.params;
    req.body.ModifiedBy = new ObjectId(userId);
    req.body.updatedTime = new Date();

    await UpdateOne("organization", { _id: new ObjectId(id) }, req.body);
    // //console.log("abc-->", abc);
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
 * Active-Inactive Email-Whatsapp-SMS Service
 */
const ActiveInactiveService = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    req.body.ModifiedBy = new ObjectId(userId);

    await UpdateOne(
      "organization",
      { _id: new ObjectId(organizationId) },
      {
        sms_service: req.body.sms_service,
        email_service: req.body.email_service,
        whatsapp_service: req.body.whatsapp_service,
        ModifiedBy: new ObjectId(userId),
        updatedTime: new Date(),
      }
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

module.exports = {
  getCompanyDetails,
  getCompanyDetailsById,
  updateCompanyDetails,
  ActiveInactiveService,
};
