const bcrypt = require("bcrypt");
const { handleException } = require("../../helpers/exception");
const Response = require("../../helpers/response");
const Constant = require("../../helpers/constant");
const moment = require("moment");

const {
  credentials,
  AccessTokenByCode,
  buessiness_account_ids,
  get_ads_data,
  get_ads_creadtive__data,
  get_adsets_data,
  get_ad_images,
  get_campaigns_data,
  get_ad_insights,
} = require("../../helpers/facebook");
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

  PermanentDelete,
  UpdateMany,
} = require("../../library/methods");

// const { HOME_PAGE_URL, EMP_WELCOME_EMAIL_TEMPLATE_ID, FORGOT_PASSWORD_URL } =
//   process.env;

/**
 * Create Account
 */

const access_token1 =
  "EAADyhh7ydycBO9ZCh3J7GKcmdZANnP6LQ9DoCKqLZAbZC2YJIYA3HLzHnRbszSqMaLjZADwQbeJKi8WZB9eHVwCKgHUpWXmZClZAuUmMzxNYrvZAQeUkhBByv3vZBmZBi5RZA8EkGsZBRwoGQchrVhsEhyy415bYgilMZBZA2T5EgYPJgx5hDut2zeMZA3ZB4eZC8BcL0DDLxCI1kKORvVWXkVO0X4FezoCGzWNrOzIkRIgTgwKuOwK48ESicXs0TIOWnOqZCRjpQDQ1QZDZD";

const create = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;

    const { name, request_url, client_id, client_secret, redirect_uri, data } =
      req.body;

    const userInfo = await FindOne("platforms_credentials", { name: name });
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
      redirect_uri,
      data,
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

    // var facebook_response = await AccessTokenByCode(code);
    var facebook_response =
      "EAADyhh7ydycBO9ZCh3J7GKcmdZANnP6LQ9DoCKqLZAbZC2YJIYA3HLzHnRbszSqMaLjZADwQbeJKi8WZB9eHVwCKgHUpWXmZClZAuUmMzxNYrvZAQeUkhBByv3vZBmZBi5RZA8EkGsZBRwoGQchrVhsEhyy415bYgilMZBZA2T5EgYPJgx5hDut2zeMZA3ZB4eZC8BcL0DDLxCI1kKORvVWXkVO0X4FezoCGzWNrOzIkRIgTgwKuOwK48ESicXs0TIOWnOqZCRjpQDQ1QZDZD";

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

    //  if(_.isUndefined(user_data.ads_account.facebook)){
    //   user_data.ads_account = {google:google_response};
    //  }else{
    //   user_data.ads_account.google = google_response;
    //  }

    //console.log(user_data);
    var update_data = await UpdateOne(
      "users",
      { _id: new ObjectId(userId) },
      {
        facebook_ads_account: facebook_response,
      }
    );

    const obj = {
      res,
      msg: Constant.INFO_MSGS.UPDATED_SUCCESSFULLY,
      status: Constant.STATUS_CODE.OK,
      data: facebook_response,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

/**
 * Get User List
 */
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
          data: 1,
        },
      },
      {
        $facet: {
          paginatedResult: [{ $skip: skip }, { $limit: parseInt(limit) }],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const usersData = await Aggregation(
      "platforms_credentials",
      aggregationQuery
    );
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
          name: name,
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
          data: 1,
        },
      },
    ];
    // User GetById Using Aggregate
    const userData = await Aggregation(
      "platforms_credentials",
      aggregationQuery
    );

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
//console.log("SSSSSSSSSSSSSSSSSSSSSSAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
const GetAuthURL = async (req, res) => {
  //console.log("222222222222222222222222");
  // const { logger } = req;
  try {
    // const respSql = await Find("platforms_credentials");
    // //console.log("11111111111111111111111111111111111111111");
    var Authdata = {};
    // const auth_url1 = await credentials();
    // respSql.forEach((element) => {
    //   if (element.name == "facebook") {
    //     var client_id = element.client_id;
    //     var redirect_uri = element.redirect_uri;

    //     var url =
    //       "https://www.facebook.com/v17.0/dialog/oauth?client_id=" +
    //       client_id +
    //       "&redirect_uri=" +
    //       redirect_uri +
    //       "&state=email&response_type=code";
    //     Authdata.facebook_auth = url;
    //   } else if (element.name == "google") {
    //     var client_id = element.client_id;
    //     var redirect_uri = element.redirect_uri;

    //     var url =
    //       "https://accounts.google.com/o/oauth2/auth?response_type=code&access_type=offline&client_id=" +
    //       client_id +
    //       "&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fspreadsheets&prompt=select_account%20consent&redirect_uri=" +
    //       redirect_uri;
    //     Authdata.google_auth = url;
    //   }
    // });

    const obj = {
      res,
      msg: Constant.INFO_MSGS.SUCCESS,
      status: Constant.STATUS_CODE.OK,
      data: Authdata,
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
        $match: { _id: new ObjectId(id), name: "facebook" },
      },

      {
        $project: {
          name: 1,
          organizationId: 1,
          request_url: 1,
          client_id: 1,
          client_secret: 1,
          redirect_uri: 1,
          data: 1,
        },
      },
    ];
    //console.log(aggregationQuery);
    const userData = await Aggregation(
      "platforms_credentials",
      aggregationQuery
    );
    //console.log(userData);
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

const updateFacebook = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    const { id } = req.params;
    const { name, request_url, client_id, client_secret, data, redirect_uri } =
      req.body;

    // const passwordHash = bcrypt.hashSync(password, 10);

    const userData = await FindOne("platforms_credentials", {
      _id: new ObjectId(id),
      name: "facebook",
    });
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

const DeleteFacebook = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    const { Id } = req.params;

    var return_data = await PermanentDelete("platforms_credentials", {
      _id: new ObjectId(Id),
    });

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

const Buessiness_Account_ids = async (req, res) => {
  const { logger } = req;
  try {
    const { userId } = req.decoded;

    // Create AggregationQuery
    let aggregationQuery = [
      {
        $match: {
          _id: new ObjectId(userId),
        },
      },

      {
        $project: {
          name: 1,
          organizationId: 1,
          profile: 1,
          email: 1,
          facebook_ads_account: 1,
        },
      },
    ];
    const userData = await Aggregation("users", aggregationQuery);
    var access_token = userData[0].facebook_ads_account;
    if (!userData) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.INFO_MSGS.NO_DATA,
      };
      return Response.error(resp);
    }

    const facebook_response = await buessiness_account_ids(access_token);

    const obj = {
      res,
      msg: Constant.INFO_MSGS.SUCCESS,
      status: Constant.STATUS_CODE.OK,
      data: facebook_response,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

const Get_Account_Data = async (req, res) => {
  const { logger } = req;
  try {
    const { account_id } = req.body;
    const { userId } = req.decoded;

    // Create AggregationQuery
    let aggregationQuery = [
      {
        $match: {
          _id: new ObjectId(userId),
        },
      },

      {
        $project: {
          name: 1,
          organizationId: 1,
          profile: 1,
          email: 1,
          facebook_ads_account: 1,
        },
      },
    ];
    const userData = await Aggregation("users", aggregationQuery);
    var access_token = userData[0].facebook_ads_account;
    // var access_token = access_token1;
    if (!userData) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.INFO_MSGS.NO_DATA,
      };
      return Response.error(resp);
    }

    const facebook_response = await get_ads_data(account_id, access_token);

    const obj = {
      res,
      msg: Constant.INFO_MSGS.SUCCESS,
      status: Constant.STATUS_CODE.OK,
      data: facebook_response.data,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

const Get_Ads_Creadtive_Data = async (req, res) => {
  const { logger } = req;
  try {
    const { account_id } = req.body;
    const { userId } = req.decoded;

    // Create AggregationQuery
    let aggregationQuery = [
      {
        $match: {
          _id: new ObjectId(userId),
        },
      },

      {
        $project: {
          name: 1,
          organizationId: 1,
          profile: 1,
          email: 1,
          facebook_ads_account: 1,
        },
      },
    ];
    const userData = await Aggregation("users", aggregationQuery);
    var access_token = userData[0].facebook_ads_account;
    if (!userData) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.INFO_MSGS.NO_DATA,
      };
      return Response.error(resp);
    }

    const facebook_response = await get_ads_creadtive__data(
      account_id,
      access_token
    );

    const obj = {
      res,
      msg: Constant.INFO_MSGS.SUCCESS,
      status: Constant.STATUS_CODE.OK,
      data: facebook_response.data,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

const Get_Adsets_Data = async (req, res) => {
  const { logger } = req;
  try {
    const { account_id } = req.body;
    const { userId } = req.decoded;

    // Create AggregationQuery
    let aggregationQuery = [
      {
        $match: {
          _id: new ObjectId(userId),
        },
      },

      {
        $project: {
          name: 1,
          organizationId: 1,
          profile: 1,
          email: 1,
          facebook_ads_account: 1,
        },
      },
    ];
    const userData = await Aggregation("users", aggregationQuery);
    var access_token = userData[0].facebook_ads_account;
    // var access_token = access_token1;
    if (!userData) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.INFO_MSGS.NO_DATA,
      };
      return Response.error(resp);
    }

    const facebook_response = await get_adsets_data(account_id, access_token);
    const obj = {
      res,
      msg: Constant.INFO_MSGS.SUCCESS,
      status: Constant.STATUS_CODE.OK,
      data: facebook_response.data,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

const Get_Ad_Images = async (req, res) => {
  const { logger } = req;
  try {
    const { account_id } = req.body;
    const { userId } = req.decoded;

    // Create AggregationQuery
    let aggregationQuery = [
      {
        $match: {
          _id: new ObjectId(userId),
        },
      },

      {
        $project: {
          name: 1,
          organizationId: 1,
          profile: 1,
          email: 1,
          facebook_ads_account: 1,
        },
      },
    ];
    const userData = await Aggregation("users", aggregationQuery);
    var access_token = userData[0].facebook_ads_account;
    if (!userData) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.INFO_MSGS.NO_DATA,
      };
      return Response.error(resp);
    }

    const facebook_response = await get_ad_images(account_id, access_token);

    const obj = {
      res,
      msg: Constant.INFO_MSGS.SUCCESS,
      status: Constant.STATUS_CODE.OK,
      data: facebook_response,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};
const Get_Campaigns_Data = async (req, res) => {
  const { logger } = req;
  try {
    const { account_id } = req.body;
    const { userId } = req.decoded;

    // Create AggregationQuery
    let aggregationQuery = [
      {
        $match: {
          _id: new ObjectId(userId),
        },
      },

      {
        $project: {
          name: 1,
          organizationId: 1,
          profile: 1,
          email: 1,
          facebook_ads_account: 1,
        },
      },
    ];
    const userData = await Aggregation("users", aggregationQuery);
    var access_token = userData[0].facebook_ads_account;
    // var access_token = access_token1;
    if (!userData) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.INFO_MSGS.NO_DATA,
      };
      return Response.error(resp);
    }

    const facebook_response = await get_campaigns_data(
      account_id,
      access_token
    );

    const obj = {
      res,
      msg: Constant.INFO_MSGS.SUCCESS,
      status: Constant.STATUS_CODE.OK,
      data: facebook_response.data,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};
const Get_Ads_Data = async (req, res) => {
  const { logger } = req;
  try {
    const { account_id } = req.body;
    const { userId } = req.decoded;

    // Create AggregationQuery
    let aggregationQuery = [
      {
        $match: {
          _id: new ObjectId(userId),
        },
      },

      {
        $project: {
          name: 1,
          organizationId: 1,
          profile: 1,
          email: 1,
          facebook_ads_account: 1,
        },
      },
    ];
    const userData = await Aggregation("users", aggregationQuery);
    // var access_token = userData[0].facebook_ads_account;
    var access_token = access_token1;
    if (!userData) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.INFO_MSGS.NO_DATA,
      };
      return Response.error(resp);
    }

    const facebook_response = await get_campaigns_data(
      account_id,
      access_token
    );

    const obj = {
      res,
      msg: Constant.INFO_MSGS.SUCCESS,
      status: Constant.STATUS_CODE.OK,
      data: facebook_response.data,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

// const Get_Ad_Insights = async (req, res) => {
//   const { logger } = req;
//   try {
//     const { ad_id } = req.body;
//     const { userId } = req.decoded;

//     // Create AggregationQuery
//     let aggregationQuery = [
//       {
//         $match: {
//          _id:new ObjectId(userId)
//         },
//       },

//       {
//         $project: {
//           name:1,
//           organizationId:1,
//           profile:1,
//           email:1,
//           facebook_ads_account:1,

//         },
//       }
//     ];
//     const userData = await Aggregation("users", aggregationQuery);
//    var access_token = userData[0].facebook_ads_account;
//     if (!userData) {
//       const resp = {
//         res,
//         status: Constant.STATUS_CODE.BAD_REQUEST,
//         msg: Constant.INFO_MSGS.NO_DATA,
//       };
//       return Response.error(resp);
//     }

//     const facebook_response = await get_ad_insights(ad_id,access_token);

//     const obj = {
//       res,
//       msg: Constant.INFO_MSGS.SUCCESS,
//       status: Constant.STATUS_CODE.OK,
//       data: facebook_response,
//     };
//     return Response.success(obj);
//   } catch (error) {
//     //console.log("error", error);
//     return handleException(logger, res, error);
//   }
// };

module.exports = {
  create,
  updateFacebook,
  GetAuthURLList,
  GetAuthURL,
  access_token,
  GetAuthURLByID,
  GetAuthURLByName,
  DeleteFacebook,
  Buessiness_Account_ids,
  Get_Account_Data,
  Get_Ads_Creadtive_Data,
  Get_Adsets_Data,
  Get_Ad_Images,
  Get_Campaigns_Data,
  // Get_Ad_Insights
};
