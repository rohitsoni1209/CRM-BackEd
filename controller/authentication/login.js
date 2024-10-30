const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const moment = require("moment");
var qs = require("qs");
const _ = require("underscore");
const axios = require("axios");
const Response = require("../../helpers/response");
const Constant = require("../../helpers/constant");
const { handleException } = require("../../helpers/exception");
const LoginValidation = require("../../helpers/joi-validation");
const {
  Find,
  UpdateOne,
  Insert,
  Aggregation,
  FindOne,
  InsertOne,
} = require("../../library/methods");
const {
  credentials,
  AccessTokenByCode,
  buessiness_account_ids,
  get_ads_data,
  get_ads_creadtive__data,
  get_adsets_data,
  get_ad_images,
  get_campaigns_data,
  get_ads_data_specific,
  get_ad_insights,
  get_leads_data,
} = require("../../helpers/facebook");

const ObjectId = require("mongodb").ObjectId;
const { JWT_SECRET, JWT_SECRET_SSO } = process.env;
const { loginLog } = require("../../utility/loginLogs");
/**
 * Generate JWT Token
 *
 * @param {object} payload (payload)
 * @param {string} type (type Access | Refresh)
 */
const generateJWTToken = async (payload, type, ip) => {
  const jti = crypto.randomBytes(10).toString("hex");
  let jtiObject = {};

  if (type !== "Access") {
    // payload.exp = 600 * 60; // 90 minutes
    payload.exp = "1day";
    jtiObject = {
      refresh: jti,
      ip: ip,
    };
    console.log("jtiObject d1", jtiObject);
    await UpdateOne(
      "users",
      { _id: payload.userId },
      { "jti.refresh": jti, "jti.ip": ip, updatedTime: new Date() }
    );
  } else {
    // payload.exp = 600 * 60; // 60 minutes
    console.log("jtiObject d2", jtiObject);
    payload.exp = "2day";
    jtiObject = {
      access: jti,
      ip: ip,
    };
    await UpdateOne(
      "users",
      { _id: payload.userId },
      { "jti.access": jti, "jti.ip": ip, updatedTime: new Date() }
    );
  }
  return new Promise(async (resolve, reject) => {
    try {
      console.log("jtiObject d3", payload);
      const { name, userId, role, organizationId } = payload;
      const token = jwt.sign(
        {
          iss: "CRM",
          aud: "CRM",
          userId,
          organizationId,
          name,
          type,
          role,
          jti,
        },
        JWT_SECRET,
        {
          expiresIn: payload.exp,
        }
      );
      // const data = await UpdateOne('users', { _id: userId },
      //     {
      //         jti:{
      //             refresh:jtiObject.refresh,
      //             access:jtiObject.access,
      //             ip:jtiObject.ip,
      //         }
      //     }
      // );

      resolve(token);
    } catch (error) {
      reject(error.message);
    }
  });
};

const generateJWTTokenForSSO = async (payload, type, ip, auth = true) => {
  console.log("payload1111111111111111111111111111", payload);
  const jti = crypto.randomBytes(10).toString("hex");
  let jtiObject = {};
  if (type !== "Access") {
    // payload.exp = auth ? 2 * 60 : 90 * 60; // 90 minutes
    payload.exp = "1day";
    jtiObject = {
      refresh: jti,
      ip: ip,
    };
    await UpdateOne(
      "users",
      { _id: payload.userId },
      { "jti.refresh": jti, "jti.ip": ip, updatedTime: new Date() }
    );
  } else {
    // payload.exp = 60 * 60; // 60 minutes
    payload.exp = "2day";
    jtiObject = {
      access: jti,
      ip: ip,
    };
    await UpdateOne(
      "users",
      { _id: payload.userId },
      { "jti.access": jti, "jti.ip": ip, updatedTime: new Date() }
    );
  }
  return new Promise(async (resolve, reject) => {
    try {
      const { name, userId, role, organizationId } = payload;
      const token = jwt.sign(
        {
          iss: "CRM",
          aud: "CRM",
          userId,
          organizationId,
          role,
          name,
          type,
          jti,
        },
        JWT_SECRET_SSO,
        {
          expiresIn: payload.exp,
        }
      );

      resolve(token);
    } catch (error) {
      reject(error.message);
    }
  });
};

/**
 * Refresh token
 * to generate new access token
 */

const refreshToken = async (req, res) => {
  const { logger } = req;
  try {
    const { userId } = req.decoded;
    const userInfo = await FindOne("users", { _id: new ObjectId(userId) });
    const payload = {
      exp: 90 * 60, // 90 minutes
      userId,
      name: userInfo.name,
    };
    const accessToken = await generateJWTToken(payload, "Access", req.clientIp);
    const refreshToken = await generateJWTToken(
      payload,
      "Refresh",
      req.clientIp
    );
    const obj = {
      res,
      msg: Constant.INFO_MSGS.SUCCESSFUL_LOGIN,
      status: Constant.STATUS_CODE.OK,
      data: {
        accessToken,
        refreshToken,
      },
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("refreshToken Error", error);
    return handleException(logger, res, error);
  }
};

const refreshTokenForSSO = async (req, res) => {
  const { logger } = req;
  try {
    const { userId } = req.decoded;
    const userInfo = await FindOne("users", { _id: userId });
    const payload = {
      exp: 90 * 60, // 90 minutes
      userId,
      name: userInfo.name,
    };
    const accessToken = await generateJWTTokenForSSO(
      payload,
      "Access",
      req.clientIp
    );
    const refreshToken = await generateJWTTokenForSSO(
      payload,
      "Refresh",
      req.clientIp,
      false
    );
    const obj = {
      res,
      msg: Constant.INFO_MSGS.SUCCESSFUL_LOGIN,
      status: Constant.STATUS_CODE.OK,
      data: {
        accessToken,
        refreshToken,
      },
    };
    return Response.success(obj);
  } catch (error) {
    return handleException(logger, res, error);
  }
};

/**
 * Login
 */
const login = async (req, res) => {
  const { logger } = req;
  try {
    const type = req.query.type;
    // const { error } = LoginValidation.login(req.body);
    // if (error) {
    //     const obj = {
    //         res,
    //         status: Constant.STATUS_CODE.BAD_REQUEST,
    //         msg: error.details[0].message,
    //     };
    //     return Response.error(obj);
    // }
    const { email, password } = req.body;
    // const userInfo = await FindOne('users', { 'email.id': email });

    const userInfo = await FindOne("users", {
      $or: [{ "email.id": email }, { "email.mobile": email }],
    });
    if (!userInfo) {
      const obj = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.ERROR_MSGS.ACCOUNT_NOT_FOUND,
      };
      return Response.error(obj);
    }
    // if (userInfo.email.registrationType !== 'Email') {
    //     const obj = {
    //         res,
    //         status: Constant.STATUS_CODE.BAD_REQUEST,
    //         msg:
    //             userInfo.email.registrationType === 'Google'
    //                 ? Constant.ERROR_MSGS.LOGIN_WITH_GOOGLE
    //                 : Constant.ERROR_MSGS.LOGIN_WITH_GOOGLE,
    //     };
    //     return Response.error(obj);
    // }
    if (userInfo.blocked.status) {
      const obj = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.ERROR_MSGS.ACCOUNT_LOCKED,
      };
      return Response.error(obj);
    }
    if (!bcrypt.compareSync(password, userInfo.email.password)) {
      const obj = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.ERROR_MSGS.INVALID_LOGIN,
      };
      return Response.error(obj);
    }
    if (!userInfo.is_active) {
      const obj = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.ERROR_MSGS.ACCOUNT_DISABLED,
      };
      return Response.error(obj);
    }
    if (!userInfo.email.verified) {
      const userData = {
        name: userInfo.name,

        email: {
          id: userInfo.email.id,
          verified: userInfo.email.verified,
        },
      };
      const obj = {
        res,
        msg: Constant.INFO_MSGS.EMAIL_NOT_VERIFIED,
        status: Constant.STATUS_CODE.OK,
        data: {
          userData,
        },
      };
      return Response.success(obj);
    }
    //console.log("userInfo ==> ", userInfo);

    const orgInfo = await FindOne("organization", {
      _id: new ObjectId(userInfo.organizationId),
    });
    const organizationId = orgInfo?._id.toHexString();
    console.log("userInfo", organizationId);
    // //console.log('today',new Date());
    //console.log("orgInsfrsdfo ==> ", orgInfo, _.isUndefined(orgInfo.package));

    // if (_.isUndefined(orgInfo.package)) {
    //   const obj = {
    //     res,
    //     status: Constant.STATUS_CODE.BAD_REQUEST,
    //     msg: Constant.ERROR_MSGS.YOUR_PACK_NOT_FOUND,
    //   };
    //   return Response.error(obj);
    // }

    // if (new Date() > orgInfo.package.end_date) {
    //   const obj = {
    //     res,
    //     status: Constant.STATUS_CODE.BAD_REQUEST,
    //     msg: Constant.ERROR_MSGS.YOUR_PACK_EXPIRED,
    //   };
    //   return Response.error(obj);
    // }

    const userAgent = req.headers["user-agent"];
    const clientIp =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    LogPayload = {
      userAgent,
      clientIp,
      userInfo,
    };
    loginLog(LogPayload);

    // const data = await commonAuth(
    //   logger,
    //   userInfo.name,
    //   userInfo._id,
    //   req.clientIp,
    //   type
    // );

    const profileInfo = await FindOne("permissionProfile", {
      _id: new ObjectId(userInfo.profile),
    });
    const userData = {
      email: {
        verified: userInfo.email.verified,
      },
      roleTitle: userInfo.roleTitle,
      profile: profileInfo.profileTitle,
      profile_id: userInfo.profile,
      _id: userInfo._id,
      orgInfo,
      role: profileInfo?.roleTitle,
      // role: userInfo.role,
    };
    const data = await commonAuth(
      logger,
      userInfo.name,
      userInfo._id,
      req.clientIp,
      type,
      profileInfo?.roleTitle,
      organizationId
    );
    data.userData = userData;

    if (userInfo.facebook_ads_account) {
      var access_token = userInfo.facebook_ads_account;
      var url =
        "https://graph.facebook.com/v17.0/me/adaccounts?&access_token=" +
        access_token;
      var data1 = {};

      const response = await axios.get(`${url}`, data1, getBasicHeaders());
      var account_id = response.data.data;
      data.facebook = {
        account_id: account_id,
        facebook_token: userInfo.facebook_ads_account,
      };
    } else {
      data.facebook = {
        account_id: null,
        facebook_token: null,
      };
    }

    await UpdateOne(
      "users",
      { _id: new ObjectId(userInfo._id) },
      {
        lastLogin: new Date(Date.now()),
        updatedTime: new Date(),
        account_id: account_id,
      }
    );
    const obj = {
      res,
      msg: Constant.INFO_MSGS.SUCCESSFUL_LOGIN,
      status: Constant.STATUS_CODE.OK,
      data,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("Login Error : ", error);
    return handleException(logger, res, error);
  }
};

/**
 * Direct Login
 */
// const directLogin = async (req, res) => {
//   const { logger } = req;
//   try {
//     const type = req.query.type;
//     const { email, password } = req.body;
//     const userInfo = await FindOne("users", {
//       $or: [{ "email.id": email }, { "email.mobile": email }],
//     });

//     if (!userInfo) {
//       const obj = {
//         res,
//         status: Constant.STATUS_CODE.BAD_REQUEST,
//         msg: Constant.ERROR_MSGS.ACCOUNT_NOT_FOUND,
//       };
//       return Response.error(obj);
//     }
//     if (userInfo.blocked.status) {
//       const obj = {
//         res,
//         status: Constant.STATUS_CODE.BAD_REQUEST,
//         msg: Constant.ERROR_MSGS.ACCOUNT_LOCKED,
//       };
//       return Response.error(obj);
//     }
//     // if (password != userInfo.email.password) {
//     //   const obj = {
//     //     res,
//     //     status: Constant.STATUS_CODE.BAD_REQUEST,
//     //     msg: Constant.ERROR_MSGS.INVALID_LOGIN,
//     //   };
//     //   return Response.error(obj);
//     // }

//     if (
//       password !=
//       "a60d5e9acccb013830706395ed61cdcd:234674938a7a09ab8cdcc7d4a24de7d0"
//     ) {
//       const obj = {
//         res,
//         status: Constant.STATUS_CODE.BAD_REQUEST,
//         msg: Constant.ERROR_MSGS.INVALID_LOGIN,
//       };
//       return Response.error(obj);
//     }

//     if (!userInfo.is_active) {
//       const obj = {
//         res,
//         status: Constant.STATUS_CODE.BAD_REQUEST,
//         msg: Constant.ERROR_MSGS.ACCOUNT_DISABLED,
//       };
//       return Response.error(obj);
//     }

//     // if (!userInfo.email.verified) {
//     //   const userData = {
//     //     name: userInfo.name,

//     //     email: {
//     //       id: userInfo.email.id,
//     //       verified: userInfo.email.verified,
//     //     },
//     //   };
//     //   const obj = {
//     //     res,
//     //     msg: Constant.INFO_MSGS.EMAIL_NOT_VERIFIED,
//     //     status: Constant.STATUS_CODE.OK,
//     //     data: {
//     //       userData,
//     //     },
//     //   };
//     //   return Response.success(obj);
//     // }

//     const orgInfo = await FindOne("organization", {
//       _id: new ObjectId(userInfo.organizationId),
//     });
//     // //console.log('orgInfo',orgInfo.package.end_date);
//     // //console.log('today',new Date());

//     // if (_.isUndefined(orgInfo.package)) {
//     //   const obj = {
//     //     res,
//     //     status: Constant.STATUS_CODE.BAD_REQUEST,
//     //     msg: Constant.ERROR_MSGS.YOUR_PACK_NOT_FOUND,
//     //   };
//     //   return Response.error(obj);
//     // }

//     // if (new Date() > orgInfo.package.end_date) {
//     //   const obj = {
//     //     res,
//     //     status: Constant.STATUS_CODE.BAD_REQUEST,
//     //     msg: Constant.ERROR_MSGS.YOUR_PACK_EXPIRED,
//     //   };
//     //   return Response.error(obj);
//     // }

//     const userAgent = req.headers["user-agent"];
//     const clientIp =
//       req.headers["x-forwarded-for"] || req.connection.remoteAddress;
//     LogPayload = {
//       userAgent,
//       clientIp,
//       userInfo,
//     };
//     loginLog(LogPayload);

//     const data = await commonAuth(
//       logger,
//       userInfo.name,
//       userInfo._id,
//       req.clientIp,
//       type
//     );

//     const profileInfo = await FindOne("permissionProfile", {
//       _id: new ObjectId(userInfo.profile),
//     });
//     const userData = {
//       email: {
//         verified: userInfo.email.verified,
//       },
//       roleTitle: userInfo.roleTitle,
//       profile: profileInfo.profileTitle,
//       profile_id: userInfo.profile,
//       _id: userInfo._id,
//       orgInfo,
//       // role: userInfo.role,
//     };
//     data.userData = userData;

//     if (userInfo.facebook_ads_account) {
//       var access_token = userInfo.facebook_ads_account;
//       var url =
//         "https://graph.facebook.com/v17.0/me/adaccounts?&access_token=" +
//         access_token;
//       var data1 = {};

//       const response = await axios.get(`${url}`, data1, getBasicHeaders());
//       var account_id = response.data.data;
//       data.facebook = {
//         account_id: account_id,
//         facebook_token: userInfo.facebook_ads_account,
//       };
//     } else {
//       data.facebook = {
//         account_id: null,
//         facebook_token: null,
//       };
//     }

//     await UpdateOne(
//       "users",
//       { _id: new ObjectId(userInfo._id) },
//       {
//         lastLogin: new Date(Date.now()),
//         updatedTime: new Date(),
//         account_id: account_id,
//       }
//     );
//     const obj = {
//       res,
//       msg: Constant.INFO_MSGS.SUCCESSFUL_LOGIN,
//       status: Constant.STATUS_CODE.OK,
//       data,
//     };
//     return Response.success(obj);
//   } catch (error) {
//     //console.log("Login Error : ", error);
//     return handleException(logger, res, error);
//   }
// };
//direct login

const directLogin = async (req, res) => {
  const { logger } = req;
  try {
    const type = req.query.type;
    const { email, password } = req.body;
    const userInfo = await FindOne("users", {
      $or: [{ "email.id": email }, { "email.mobile": email }],
    });

    if (!userInfo) {
      const obj = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.ERROR_MSGS.ACCOUNT_NOT_FOUND,
      };
      return Response.error(obj);
    }
    console.log("userInfo", userInfo);
    // if (userInfo.blocked.status) {
    //   const obj = {
    //     res,
    //     status: Constant.STATUS_CODE.BAD_REQUEST,
    //     msg: Constant.ERROR_MSGS.ACCOUNT_LOCKED,
    //   };
    //   return Response.error(obj);
    // }
    // if (password != userInfo.email.password) {
    //   const obj = {
    //     res,
    //     status: Constant.STATUS_CODE.BAD_REQUEST,
    //     msg: Constant.ERROR_MSGS.INVALID_LOGIN,
    //   };
    //   return Response.error(obj);
    // }

    if (
      password !=
      "a60d5e9acccb013830706395ed61cdcd:234674938a7a09ab8cdcc7d4a24de7d0"
    ) {
      const obj = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.ERROR_MSGS.INVALID_LOGIN,
      };
      return Response.error(obj);
    }

    // if (!userInfo.is_active) {
    //   const obj = {
    //     res,
    //     status: Constant.STATUS_CODE.BAD_REQUEST,
    //     msg: Constant.ERROR_MSGS.ACCOUNT_DISABLED,
    //   };
    //   return Response.error(obj);
    // }

    // if (!userInfo.email.verified) {
    //   const userData = {
    //     name: userInfo.name,

    //     email: {
    //       id: userInfo.email.id,
    //       verified: userInfo.email.verified,
    //     },
    //   };
    //   const obj = {
    //     res,
    //     msg: Constant.INFO_MSGS.EMAIL_NOT_VERIFIED,
    //     status: Constant.STATUS_CODE.OK,
    //     data: {
    //       userData,
    //     },
    //   };
    //   return Response.success(obj);
    // }

    // const orgInfo = await FindOne("organization", {
    //   _id: new ObjectId(userInfo.organizationId),
    // });
    // //console.log('orgInfo',orgInfo.package.end_date);
    // //console.log('today',new Date());

    // if (_.isUndefined(orgInfo.package)) {
    //   const obj = {
    //     res,
    //     status: Constant.STATUS_CODE.BAD_REQUEST,
    //     msg: Constant.ERROR_MSGS.YOUR_PACK_NOT_FOUND,
    //   };
    //   return Response.error(obj);
    // }

    // if (new Date() > orgInfo.package.end_date) {
    //   const obj = {
    //     res,
    //     status: Constant.STATUS_CODE.BAD_REQUEST,
    //     msg: Constant.ERROR_MSGS.YOUR_PACK_EXPIRED,
    //   };
    //   return Response.error(obj);
    // }

    const userAgent = req.headers["user-agent"];
    const clientIp =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    LogPayload = {
      userAgent,
      clientIp,
      userInfo,
    };
    loginLog(LogPayload);


    const orgInfo = await FindOne("organization", {
      _id: new ObjectId(userInfo.organizationId),
    });
    const organizationId = orgInfo?._id.toHexString();
    console.log("userInfo", organizationId);

    const profileInfo = await FindOne("permissionProfile", {
      _id: new ObjectId(userInfo.profile),
    });
    const name = userInfo.firstName + " " + userInfo.lastName;
    const data = await commonAuth(
      logger,
      name,
      userInfo._id,
      req.clientIp,
      type,
      profileInfo?.roleTitle,
      organizationId
    );
    // const data = await commonAuth(
    //   logger,
    //   userInfo.name,
    //   userInfo._id,
    //   req.clientIp,
    //   type,
    //   profileInfo?.roleTitle
    // );
    const userData = {
      email: {
        verified: userInfo.email.verified,
      },
      roleTitle: userInfo.roleTitle,
      profile: profileInfo.profileTitle,
      profile_id: userInfo.profile,
      roleTitle: profileInfo?.roleTitle,
      profile: "Administrator",
      //profile_id: userInfo.profile,
      _id: userInfo._id,
      // orgInfo,
      // orgInfo,
      role: userInfo.roleTitle,
    };

    // console.log(userData);

    data.userData = userData;

    // if (userInfo.facebook_ads_account) {
    //   var access_token = userInfo.facebook_ads_account;
    //   var url =
    //     "https://graph.facebook.com/v17.0/me/adaccounts?&access_token=" +
    //     access_token;
    //   var data1 = {};

    // const response = await axios.get(`${url}`, data1, getBasicHeaders());
    // var account_id = response.data.data;
    //   data.facebook = {
    //     account_id: account_id,
    //     facebook_token: userInfo.facebook_ads_account,
    //   };
    // } else {
    //   data.facebook = {
    //     account_id: null,
    //     facebook_token: null,
    //   };
    // }

    // await UpdateOne(
    //   "users",
    //   { _id: new ObjectId(userInfo._id) },
    //   {
    //     lastLogin: new Date(Date.now()),
    //     updatedTime: new Date(),
    //     account_id: account_id,
    //   }
    // );

    // console.log("tsst", userInfo);
    // console.log("tsst", userInfo);
    const obj = {
      res,
      msg: Constant.INFO_MSGS.SUCCESSFUL_LOGIN,
      status: Constant.STATUS_CODE.OK,
      data,
    };
    return Response.success(obj);
  } catch (error) {
    console.log("Login Error : ", error);
    return handleException(logger, res, error);
  }
};

/**
 * Common Auth function for 2FA checking and JWT token generation
 */
const commonAuth = (logger, name, userId, ip, type, role, organizationId) =>
  new Promise(async (resolve, reject) => {
    try {
      if (!type) {
        const payload = {
          exp: 15 * 60, // 10 minutes
          name,
          userId,
          role,
          organizationId,
        };
        console.log("payloadif", payload);
        const accessToken = await generateJWTToken(payload, "Access", ip);
        const refreshToken = await generateJWTToken(payload, "Refresh", ip);
        const data = {
          accessToken,
          refreshToken,
        };
        resolve(data);
      } else if (type === "landscap") {
        const payload = {
          exp: 2 * 60, // 10 minutes
          name,
          userId,
          role,
          organizationId,
        };
        console.log("payloadelse", payload);
        const accessToken = await generateJWTTokenForSSO(payload, "Access", ip);
        const refreshToken = await generateJWTTokenForSSO(
          payload,
          "Refresh",
          ip
        );
        const data = {
          accessToken,
          refreshToken,
        };
        resolve(data);
      }
    } catch (error) {
      //console.log("common Auth Log :", error);
      reject(error);
    }
  });

/**
 * Logout (removed JTI from db and set it to null)
 * Allows single session Only
 */
const logout = async (req, res) => {
  const { logger } = req;
  try {
    if (!req.decoded) {
      const obj = {
        res,
        status: Constant.STATUS_CODE.RESOURCE_NOT_FOUND,
        msg: Constant.ERROR_MSGS.TOKEN_MISSING,
      };
      return Response.error(obj);
    }

    const { userId } = req.decoded;
    const user = await User.findById(userId);
    await UpdateOne(
      "users",
      { _id: userId },
      {
        jti: {
          access: null,
          refresh: null,
          ip: null,
        },
        updatedTime: new Date(),
      }
    );
    const obj = {
      res,
      msg: Constant.INFO_MSGS.SUCCESSFUL_LOGOUT,
      status: Constant.STATUS_CODE.OK,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("logout error", error);
    return handleException(logger, res, error);
  }
};

const getBasicHeaders = () => {
  return {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };
};

//FACEBOOK CONTROLLER =================================================STARTS
const access_token1 =
  "EAADyhh7ydycBO4jGRaulqUdUKZBvox8dVHGOKwgqXbA4AKGsnLlWc1qe5bCnzybxSEXfvu7nivuKejVOuiDGJtG5Qo6V5oHjVsPjNcAhvrmbJlgMj8LnxWeKi5gEkzq5J1KspPnlX8bLAJbXHos23ZCQTbZArRCbbKtZCdXxBBZCwblb4GWeAu4ZCZBN8gRzRWGNgQ6maAvG2Yg1W8ZCeghhoOzgjnYlRtzoQQ4V6SCQHBzZA7Men14KUPgQz94F1t6pckwZDZD";

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

    var facebook_response = await AccessTokenByCode(code);
    var facebook_data = {};
    // var facebook_response =
    //   "EAADyhh7ydycBO9ZCh3J7GKcmdZANnP6LQ9DoCKqLZAbZC2YJIYA3HLzHnRbszSqMaLjZADwQbeJKi8WZB9eHVwCKgHUpWXmZClZAuUmMzxNYrvZAQeUkhBByv3vZBmZBi5RZA8EkGsZBRwoGQchrVhsEhyy415bYgilMZBZA2T5EgYPJgx5hDut2zeMZA3ZB4eZC8BcL0DDLxCI1kKORvVWXkVO0X4FezoCGzWNrOzIkRIgTgwKuOwK48ESicXs0TIOWnOqZCRjpQDQ1QZDZD";

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
    var url =
      "https://graph.facebook.com/v17.0/me/adaccounts?&access_token=" +
      facebook_response;
    var data1 = {};

    const response = await axios.get(`${url}`, data1, getBasicHeaders());
    var account_id = response.data.data;

    var update_data = await UpdateOne(
      "users",
      { _id: new ObjectId(userId) },
      {
        facebook_ads_account: facebook_response,
        account_id: account_id,
      }
    );
    facebook_data.access_token = facebook_response;
    facebook_data.account_id = account_id;
    const obj = {
      res,
      msg: Constant.INFO_MSGS.UPDATED_SUCCESSFULLY,
      status: Constant.STATUS_CODE.OK,
      data: facebook_data,
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

const GetAuthURL = async (req, res) => {
  const { logger } = req;
  try {
    const respSql = await Find("platforms_credentials");

    var Authdata = {};
    const auth_url1 = await credentials();
    respSql.forEach((element) => {
      if (element.name == "facebook") {
        var client_id = element.client_id;
        var redirect_uri = element.redirect_uri;

        var url =
          "https://www.facebook.com/v17.0/dialog/oauth?client_id=" +
          client_id +
          "&redirect_uri=" +
          redirect_uri +
          "&state=email&response_type=code";
        Authdata.facebook_auth = url;
      } else if (element.name == "google") {
        var client_id = element.client_id;
        var redirect_uri = element.redirect_uri;

        var url =
          "https://accounts.google.com/o/oauth2/auth?response_type=code&access_type=offline&client_id=" +
          client_id +
          "&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fspreadsheets&prompt=select_account%20consent&redirect_uri=" +
          redirect_uri;
        Authdata.google_auth = url;
      }
    });

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

const Get_Leads_Data_By_Ads = async (req, res) => {
  const { logger } = req;
  try {
    const { ads_id } = req.body;
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

    const facebook_response = await get_leads_data(ads_id, access_token);

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

const Get_SpecificAdSetsID = async (req, res) => {
  const { logger } = req;
  try {
    const { ads_id } = req.body;
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

    const facebook_response = await get_ads_data_specific(ads_id, access_token);

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

//FACEBOOK CONTROLLER =================================================ENDS

module.exports = {
  refreshToken,
  login,
  directLogin,
  generateJWTToken,
  logout,
  commonAuth,
  refreshTokenForSSO,
  generateJWTTokenForSSO,
  GetAuthURL,
  create,
  updateFacebook,
  GetAuthURLList,
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
  Get_Leads_Data_By_Ads,
  Get_SpecificAdSetsID,
};
