const bcrypt = require("bcrypt");
const { handleException } = require("../../helpers/exception");
const Response = require("../../helpers/response");
const Constant = require("../../helpers/constant");
const moment = require("moment");
const Email = require("../../helpers/email");
const ProfileValidation = require("../../helpers/joi-validation");
const randomString = require("crypto-random-string");
const SignupValidation = require("../../helpers/joi-validation");
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

const {
  HOME_PAGE_URL,
  EMP_WELCOME_EMAIL_TEMPLATE_ID,
  FORGOT_PASSWORD_URL,
  FORGOT_PASSWORD_TEMPLATE_ID,
} = process.env;

/**
 * Create Account
 */
const createUser = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;

    const {
      firstName,
      lastName,
      email,
      // password,
      mobile,
      roleId,
      profile,
      alias,
      phone,
      website,
      fax,
      DOB,
      street,
      city,
      state,
      country,
      zipCode,
      socialProfiles,
      language,
      countryLocale,
      groupId,
    } = req.body;
    // let password = mobile;
    const { error } = SignupValidation.registerbyCEO({
      firstName,
      lastName,
      email,
    });
    if (error) {
      const obj = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: error.details[0].message,
      };
      return Response.error(obj);
    }

    const orgInfo = await FindOne("organization", {
      _id: new ObjectId(organizationId),
    });
    const totalInfo = await Find("users", {
      organizationId: new ObjectId(organizationId),
    });
    console.log("totalInfo", totalInfo);
    // console.log('today',new Date());
    if (totalInfo.length >= orgInfo.package.packageNoOfUser) {
      const obj = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.ERROR_MSGS.YOUR_PACK_USER_LIMIT_USED,
      };
      return Response.error(obj);
    }

    const userInfo = await FindOne("users", { "email.id": email });
    if (userInfo) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.ERROR_MSGS.ACCOUNT_EMAIL_EXISTS,
      };
      return Response.error(resp);
    }
    const userMInfo = await FindOne("users", { "email.mobile": mobile });
    if (userMInfo) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.ERROR_MSGS.ACCOUNT_MOBILE_EXISTS,
      };
      return Response.error(resp);
    }

    // Encrypt password By Bcrypt
    // const passwordHash = bcrypt.hashSync(password, 10);

    if (!ObjectId.isValid(profile)) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: `${Constant.ERROR_MSGS.INVALID_OBJECT_ID} Of Profile`,
      };
      return Response.error(resp);
    }
    // if (!ObjectId.isValid(groupId)) {
    //   const resp = {
    //     res,
    //     status: Constant.STATUS_CODE.BAD_REQUEST,
    //     msg: `${Constant.ERROR_MSGS.INVALID_OBJECT_ID} Of GroupId`,
    //   };
    //   return Response.error(resp);
    // }
    if (!ObjectId.isValid(roleId)) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: `${Constant.ERROR_MSGS.INVALID_OBJECT_ID} Of RoleId`,
      };
      return Response.error(resp);
    }

    const rolesData = await FindOne("roles", { _id: new ObjectId(roleId) });
    if (!rolesData) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.ERROR_MSGS.ROLE_NOT_EXISTS,
      };
      return Response.error(resp);
    }

    // Email Token Verification
    const token = randomString({
      length: 15,
      type: "url-safe",
    });
    // Create User Document in Mongodb

    let groupIdS = null;
    if (groupId) {
      groupIdS = new ObjectId(groupId);
    } else {
      groupIdS = null;
    }

    await InsertOne("users", {
      firstName,
      lastName,
      // city : new ObjectId(city),
      role: new ObjectId(roleId),
      roleTitle: rolesData.roleTitle,
      organizationId: new ObjectId(organizationId),
      profile: new ObjectId(profile),
      groupId: groupIdS,
      alias,
      phone,
      website,
      fax,
      DOB,
      street,
      city,
      state,
      country,
      zipCode,
      socialProfiles,
      is_active: true,
      language,
      countryLocale,
      "otp.verified": true,
      email: {
        id: email,
        mobile,
        verified: true,
        registrationType: "Created",
        // password: passwordHash,
        token: {
          token,
          createdAt: Date.now(),
        },
      },
      status: true,
      blocked: {
        status: false,
        expiry: null,
      },
      jti: {
        access: null,
        refresh: null,
        ip: null,
      },
      createdById: new ObjectId(userId),
      createdTime: new Date(),
      updatedTime: new Date(),
    });
    // Send Response To Client

    let tokenExpiryDate = moment(new Date(), "MM-DD-YYYY").add(2, "hours");

    const userData = await UpdateOne(
      "users",
      {
        "email.id": email,
      },
      {
        forgotPassword: {
          token: token,
          createdAt: Date.now(),
          expiryDate: tokenExpiryDate,
        },
      }
    );

    const payload = {
      name: firstName + lastName,
      emailid: email,
      resetPassword: `${FORGOT_PASSWORD_URL}${token}`,
      homePageLink: `${HOME_PAGE_URL}`,
    };

    Email.Email(logger, EMP_WELCOME_EMAIL_TEMPLATE_ID, email, payload);

    const payloadForgot = {
      name: firstName + lastName,
      resetPassword: `${FORGOT_PASSWORD_URL}${token}`,
    };
    Email.Email(logger, FORGOT_PASSWORD_TEMPLATE_ID, email, payloadForgot);

    const obj = {
      res,
      status: Constant.STATUS_CODE.OK,
      msg: Constant.INFO_MSGS.USER_CREATED,
      data: {
        name: firstName + lastName,
        email,
      },
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
const getUserList = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId ,role } = req.decoded;
    let { sortBy, offset, limit, str, active, userlist = false } = req.query;
    const isCEO = role === "CEO";

   
    let queryObj = req.query;
    delete queryObj.offset;
    delete queryObj.sortBy;
    delete queryObj.limit;

    delete queryObj.active;
    delete queryObj.str;
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
    console.log('Hello123',userlist)
    if (!userlist) {
      //matchCondition._id = { $ne: new ObjectId(userId) };
      throw new Error("Not Allowed");
    }else if (!isCEO) {
      matchCondition["_id"] = new ObjectId(userId) ;
    }
    console.log(matchCondition);
    if (active === "true") {
      //console.log(active);
      matchCondition.is_active = true;
    }
    if (active === "false") {
      //console.log(active);
      matchCondition.is_active = false;
    }
    if (str) {
      orCondition.push(
        { "email.id": { $regex: str, $options: "i" } },
        { firstName: { $regex: str, $options: "i" } },
        { lastName: { $regex: str, $options: "i" } },
        { city: { $regex: str, $options: "i" } },
        { state: { $regex: str, $options: "i" } },
        { country: { $regex: str, $options: "i" } },
        { zipCode: { $regex: str, $options: "i" } }
      );
    }
    // if (orCondition.length) {
    //   //console.log("Or-Done");
    //   matchCondition = { ...matchCondition, $or: orCondition };
    // }
    // //console.log("orCondition->", orCondition);
    //console.log("matchCondition-->", matchCondition);

    let aggregationQuery = [
      {
        $match: matchCondition,
      },
      // {
      //   $lookup: {
      //     from: "organization",
      //     localField: "organizationId",
      //     foreignField: "_id",
      //     as: "organizationData",
      //   },
      // },
      // {
      //   $unwind: {
      //     path: "$organizationData",
      //     preserveNullAndEmptyArrays: false,
      //   },
      // },
      {
        $lookup: {
          from: "permissionProfile",
          localField: "profile",
          foreignField: "_id",
          as: "profileData",
        },
      },
      {
        $unwind: {
          path: "$profileData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "group",
          localField: "groupId",
          foreignField: "_id",
          as: "groupData",
        },
      },
      {
        $unwind: {
          path: "$groupData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          active: 1,
          role: 1,
          roleTitle: 1,
          email: "$email.id",
          mobile: "$email.mobile",
          secondaryEmail: "$email.secondaryEmail",
          registrationType: "$email.registrationType",
          verified: "$email.verified",
          // organizationId:1,
          // organizationData:'$organizationData',
          profileTitle: "$profileData.profileTitle",
          profile: "$profileData",
          groupTitle: "$groupData.groupTitle",
          group: "$groupData",
          alias: 1,
          phone: 1,
          website: 1,
          fax: 1,
          DOB: 1,
          street: 1,
          city: 1,
          state: 1,
          country: 1,
          zipCode: 1,
          socialProfiles: 1,
          language: 1,
          countryLocale: 1,
          is_active: 1,
        },
      },
      {
        $facet: {
          paginatedResult: [{ $skip: skip }, { $limit: parseInt(limit) }],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const usersData = await Aggregation("users", aggregationQuery);
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

/**
 * GetById Users
 */

const getUserById = async (req, res) => {
  const { logger } = req;
  try {
    const { id } = req.params;

    // Create AggregationQuery
    let aggregationQuery = [
      {
        $match: {
          _id: new ObjectId(id),
        },
      },
      {
        $lookup: {
          from: "permissionProfile",
          localField: "profile",
          foreignField: "_id",
          as: "profileData",
        },
      },
      {
        $unwind: {
          path: "$profileData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          role: 1,
          roleTitle: 1,
          email: "$email.id",
          mobile: "$email.mobile",
          secondaryEmail: "$email.secondaryEmail",
          registrationType: "$email.registrationType",
          verified: "$email.verified",
          // organizationId:1,
          // organizationData:'$organizationData',
          profileTitle: "$profileData.profileTitle",
          profile: "$profileData",
          alias: 1,
          phone: 1,
          website: 1,
          fax: 1,
          DOB: 1,
          street: 1,
          city: 1,
          state: 1,
          country: 1,
          zipCode: 1,
          socialProfiles: 1,
          language: 1,
          countryLocale: 1,
          is_active: 1,
        },
      },
    ];
    // User GetById Using Aggregate
    const userData = await Aggregation("users", aggregationQuery);

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

/**
 * Update Users
 */
const updateUsers = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    const { id } = req.params;
    const {
      firstName,
      lastName,
      // password,
      roleId,
      profile,
      groupId,
      alias,
      phone,
      mobile,
      website,
      fax,
      DOB,
      street,
      city,
      state,
      country,
      zipCode,
      socialProfiles,
      language,
      countryLocale,
    } = req.body;

    // const passwordHash = bcrypt.hashSync(password, 10);
    const rolesData = await FindOne("roles", { _id: new ObjectId(roleId) });
    if (!rolesData) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.ERROR_MSGS.ROLE_NOT_EXISTS,
      };
      return Response.error(resp);
    }
    const userData = await FindOne("users", { _id: new ObjectId(id) });
    if (!userData) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.ERROR_MSGS.ACCOUNT_NOT_FOUND,
      };
      return Response.error(resp);
    }

    //console.log("userData--->", userData);

    await UpdateOne(
      "users",
      { _id: new ObjectId(id) },
      {
        firstName,
        lastName,
        role: new ObjectId(roleId),
        roleTitle: rolesData.roleTitle,
        profile: new ObjectId(profile),
        groupId: new ObjectId(groupId),
        alias,
        phone,
        website,
        fax,
        DOB,
        street,
        city,
        state,
        country,
        zipCode,
        countryLocale,
        language,
        socialProfiles,
        email: {
          id: userData.email.id,
          mobile: mobile,
          verified: userData.email.verified,
          registrationType: userData.email.registrationType,
          // password: passwordHash,
          password: userData.email.password,
        },
        status: true,
        blocked: {
          status: false,
          expiry: null,
        },
        jti: {
          access: userData.jti.access,
          refresh: userData.jti.refresh,
          ip: userData.jti.ip,
        },
        updatedById: new ObjectId(userId),
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

/**
 * Active-Inactive Users
 */
const ActiveInactiveUsers = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    const { id } = req.params;
    req.body.ModifiedBy = new ObjectId(userId);
    req.body.updatedTime = new Date();

    const userData = await FindOne("users", { _id: new ObjectId(id) });
    if (!userData) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.ERROR_MSGS.ACCOUNT_NOT_FOUND,
      };
      return Response.error(resp);
    }

    //console.log("userData--->", userData);

    await UpdateOne("users", { _id: new ObjectId(id) }, req.body);
    const obj = {
      res,
      msg: Constant.INFO_MSGS.SUCCESS,
      status: Constant.STATUS_CODE.OK,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

const BulkActiveInactiveUsers = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    // const { id } = req.params;
    const { id, is_active } = req.body;
    req.body.ModifiedBy = new ObjectId(userId);

    for (let i = 0; i < id.length; i++) {
      const userData = await FindOne("users", { _id: new ObjectId(id[i]) });
      if (!userData) {
        const resp = {
          res,
          status: Constant.STATUS_CODE.BAD_REQUEST,
          msg: Constant.ERROR_MSGS.ACCOUNT_NOT_FOUND,
        };
        return Response.error(resp);
      }

      //console.log("userData--->", userData);

      await UpdateMany("users", { _id: new ObjectId(id[i]) }, { is_active });
    }
    const obj = {
      res,
      msg: Constant.INFO_MSGS.SUCCESS,
      status: Constant.STATUS_CODE.OK,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

module.exports = {
  createUser,
  updateUsers,
  getUserList,
  getUserById,
  ActiveInactiveUsers,
  BulkActiveInactiveUsers,
};
