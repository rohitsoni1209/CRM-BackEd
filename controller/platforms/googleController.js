const bcrypt = require("bcrypt");
const { handleException } = require("../../helpers/exception");
const Response = require("../../helpers/response");
const Constant = require("../../helpers/constant");
const moment = require("moment");
const Email = require("../../helpers/email");
const ProfileValidation = require("../../helpers/joi-validation");
const randomString = require("crypto-random-string");
const SignupValidation = require("../../helpers/joi-validation");
const { credentials, AccessTokenByCode } = require("../../helpers/google");
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
  UpdateMany,
} = require("../../library/methods");

const { HOME_PAGE_URL, EMP_WELCOME_EMAIL_TEMPLATE_ID, FORGOT_PASSWORD_URL } =
  process.env;

/**
 * Create Account
 */
const createGoogle = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;

    const {
      name,
      request_url,
      client_id,
      client_secret,
      data,
      redirect_uri,

    } = req.body;


    const userInfo = await FindOne("platforms_credentials", { "name": name });
    if (userInfo) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.ERROR_MSGS.PLATFORM_EXISTS,
      };
      return Response.error(resp);
    }


    // Create User Document in Mongodb
    await InsertOne("platforms_credentials", {
      organizationId: new ObjectId(organizationId),
      name,
      request_url,
      client_id,
      client_secret,
      data,
      redirect_uri

    });

    const obj = {
      res,
      status: Constant.STATUS_CODE.OK,
      msg: Constant.INFO_MSGS.PLATFORM_CREATED,

    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};



const access_token = async (req, res) => {
  const { logger } = req;

  try {
    let { code } = req.body;
    const { userId } = req.decoded;


    const google_response = await AccessTokenByCode(code);

    const userDetails = await Aggregation("users", [
      { $match: { _id: new ObjectId(userId) } },
      {
        $lookup: {
          from: "cities",
          localField: "city",
          foreignField: "_id",
          as: "cities",
        },
      },
      {
        $unwind: { path: "$cities", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "organization",
          localField: "companyId",
          foreignField: "_id",
          as: "organizationData",
        },
      },
      {
        $unwind: {
          path: "$organizationData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          name: 1,
          type: 1,
          company: 1,
          // role: 1,
          // roleTitle:1,
          profile: 1,
          alias: 1,
          phone: 1,
          mobile: 1,
          website: 1,
          fax: 1,
          DOB: 1,
          street: 1,
          state: 1,
          country: 1,
          zipCode: 1,
          countryLocale: 1,
          language: 1,
          socialProfiles: 1,
          userName: {
            $ifNull: ["$userName", null],
          },
          jti: 1,
          city: "$cities",
          organizationData: "$organizationData",
          mobile: "$email.mobile",
          email: "$email.id",
          profilePicture: 1,
          secondaryEmailId: "$email.secondaryEmail",
          isPrivate: 1,
          calender: 1,
          // calender_access_token:'$calender.access_token',
          // calender_expired_in:'$calender.expired_in',
          // registrationType: "$email.registrationType",
        },
      },
    ]);
    if (!userDetails) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.ERROR_MSGS.USER_NOT_FOUND,
      };
      return Response.error(resp);
    }
    var user_data = userDetails[0];

    //console.log(user_data);
    var update_data = await UpdateOne(
      "users",
      { _id: new ObjectId(userId) },
      {
        google_ads_account: google_response
      }

    );
    const obj = {
      res,
      msg: Constant.INFO_MSGS.UPDATED_SUCCESSFULLY,
      status: Constant.STATUS_CODE.OK,
      data: google_response,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};




const GetAuthURLList = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
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
    matchCondition._id = { $ne: new ObjectId(userId) };
    // matchCondition.name = { name:'google' };



    let aggregationQuery = [
      {
        $match: matchCondition,
      },

      {
        $project: {
          name: 1,
          organizationId: 1,
          request_url: 1,
          client_id: 1,
          client_secret: 1,
          redirect_uri: 1,
          data: 1
        },
      },
      {
        $facet: {
          paginatedResult: [{ $skip: skip }, { $limit: parseInt(limit) }],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const usersData = await Aggregation("platforms_credentials", aggregationQuery);
    if (!usersData[0].paginatedResult.length) {
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
        usersData: usersData[0].paginatedResult,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: usersData[0].totalCount[0].count,
        },
      },
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};



const GetAuthURLByName = async (req, res) => {
  const { logger } = req;
  try {
    const { name } = req.params;

    // Create AggregationQuery
    let aggregationQuery = [
      {
        $match: {
          name: name
        },
      },

      {
        $project: {
          name: 1,
          organizationId: 1,
          request_url: 1,
          client_id: 1,
          client_secret: 1,
          redirect_uri: 1,
          data: 1
        },
      }
    ];
    // User GetById Using Aggregate
    const userData = await Aggregation("platforms_credentials", aggregationQuery);

    if (!userData) {
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
      data: userData,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};
const GetAuthURL = async (req, res) => {
  const { logger } = req;
  try {
    const auth_url1 = await credentials()

    var client_id = auth_url1.client_id;
    var redirect_uri = auth_url1.redirect_uri;
    var url =
      "https://accounts.google.com/o/oauth2/auth?response_type=code&access_type=offline&client_id=" +
      client_id +
      "&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fspreadsheets&prompt=select_account%20consent&redirect_uri=" +
      redirect_uri;

    auth_url1.auth_url = url;

    const obj = {
      res,
      msg: Constant.INFO_MSGS.SUCCESS,
      status: Constant.STATUS_CODE.OK,
      data: auth_url1,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};



const GetAuthURLByID = async (req, res) => {
  const { logger } = req;
  try {
    const { id } = req.params;

    // Create AggregationQuery
    let aggregationQuery = [
      {
        $match: { _id: new ObjectId(id), name: 'google' }
      },

      {
        $project: {
          name: 1,
          organizationId: 1,
          request_url: 1,
          client_id: 1,
          client_secret: 1,
          redirect_uri: 1,
          data: 1
        },
      }
    ];

    const userData = await Aggregation("platforms_credentials", aggregationQuery);
    if (userData.length < 1) {
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
      data: userData,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};


const updateGoogle = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    const { id } = req.params;
    const {
      name,
      request_url,
      client_id,
      client_secret,
      data,
      redirect_uri,
    } = req.body;

    // const passwordHash = bcrypt.hashSync(password, 10);

    const userData = await FindOne("platforms_credentials", { _id: new ObjectId(id), name: 'google' });
    if (!userData) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.ERROR_MSGS.PLATFORM_NOT_FOUND,
      };
      return Response.error(resp);
    }



    await UpdateOne(
      "platforms_credentials",
      { _id: new ObjectId(id) },
      {
        name,
        request_url,
        client_id,
        client_secret,
        data,
        redirect_uri,
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
const DeleteGoogle = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    const { dataList } = req.body;
    // return
    var payload = [];
    for (let i = 0; i < req.body.dataList.length; i++) {
      payload.push(new ObjectId(req.body.dataList[i]));
    }
    const listData = await DeleteMany("platforms_credentials", { _id: { $in: payload }, organizationId: new ObjectId(organizationId) });
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




module.exports = {
  createGoogle,
  updateGoogle,
  GetAuthURLList,
  GetAuthURL,
  GetAuthURLByID,
  GetAuthURLByName,
  DeleteGoogle,
  access_token
};
