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
} = require("../../library/methods");
/**
 * Get user details
 */
const getUserProfile = async (req, res) => {
  const { logger } = req;
  try {
    const { userId } = req.decoded;
    console.log("userDetails===>1", userId);

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
          firstName: 1,
          lastName: 1,
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
    console.log("userDetails===>", userDetails);
    if (!userDetails) {
      const obj = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.INFO_MSGS.NO_DATA,
      };
      return Response.error(obj);
    } else {
      const obj = {
        res,
        msg: Constant.INFO_MSGS.SUCCESS,
        status: Constant.STATUS_CODE.OK,
        data: userDetails,
      };
      return Response.success(obj);
    }
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};


/**
 * Get user details
 */
const getUserProfileById = async (req, res) => {
  const { logger } = req;
  try {
    const { id } = req.params;
    const userDetails = await Aggregation("users", [
      { $match: { _id: new ObjectId(id) } },
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
          firstName: 1,
          lastName: 1,
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
    //console.log("userDetails", userDetails);
    if (!userDetails) {
      const obj = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.INFO_MSGS.NO_DATA,
      };
      return Response.error(obj);
    } else {
      const obj = {
        res,
        msg: Constant.INFO_MSGS.SUCCESS,
        status: Constant.STATUS_CODE.OK,
        data: userDetails,
      };
      return Response.success(obj);
    }
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

/**
 * Update user details
 */
const updateUserProfile = async (req, res) => {
  const { logger } = req;
  try {
    const { userId } = req.decoded;
    const {
      // company,
      mobile,
      // city,
      // name,
      firstName,
      lastName,
      // roleId,
      // password,
      // profile,
      alias,
      phone,
      website,
      fax,
      DOB,
      street,
      state,
      country,
      zipCode,
      socialProfiles,
      secondaryEmailId,
      language,
      countryLocale,
    } = req.body;

    const data = {
      firstName,
      lastName,
      company: req.body.company,
      mobile: req.body.mobile,
      secondaryEmailId: req.body.secondaryEmailId,
    };
    const { error } = ProfileValidation.updateUserProfile(data);
    if (error) {
      const obj = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: error.details[0].message,
      };
      return Response.error(obj);
    }

    const userData = await FindOne("users", { _id: new ObjectId(userId) });
    if (!userData) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.ERROR_MSGS.ACCOUNT_NOT_FOUND,
      };
      return Response.error(resp);
    }

    //console.log("userData--->", userData);

    const userDetails = await UpdateOne(
      "users",
      { _id: new ObjectId(userId) },
      {
        // name: name,
        firstName,
        lastName,
        // profile: new ObjectId(profile),
        alias,
        phone,
        website,
        fax,
        DOB,
        street,
        state,
        country,
        zipCode,
        socialProfiles,
        language,
        countryLocale,
        email: {
          id: userData.email.id,
          mobile: mobile,
          secondaryEmailId,
          verified: userData.email.verified,
          registrationType: userData.email.registrationType,
          password: userData.email.password,
        },
        updatedById: new ObjectId(userId),
        updatedTime: new Date(),
        // 'email.secondaryEmail': secondaryEmailId,
        // 'city': new ObjectId(city),
      }
    );

    //console.log("userDetails-->", userDetails);
    const obj = {
      res,
      status: Constant.STATUS_CODE.OK,
      msg: Constant.INFO_MSGS.SUCCESSFUL_UPDATE,
      // data: { emailId: userDetails.email.id, name: userDetails.name },
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("err", error);
    return handleException(logger, res, error);
  }
};

/**
 * Change the customer password in profile
 * @param {string} currentPassword
 * @param {string} newPassword
 */
const changePassword = async (req, res) => {
  const { logger } = req;
  try {
    const { userId } = req.decoded;

    const { error } = ProfileValidation.validateChangePassword(req.body);
    if (error) {
      const obj = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: error.details[0].message,
      };
      return Response.error(obj);
    }

    const { currentPassword, newPassword } = req.body;

    const user = await FindOne("users", { _id: new ObjectId(userId) });

    if (user.email.registrationType !== "Email") {
      const obj = {
        res,
        msg: Constant.ERROR_MSGS.CHANGE_PASSWORD_NOT_ALLOWED,
        status: Constant.STATUS_CODE.BAD_REQUEST,
      };
      return Response.error(obj);
    }
    if (!bcrypt.compareSync(currentPassword, user.email.password)) {
      const obj = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.ERROR_MSGS.INCORRECT_PASSWORD,
      };
      return Response.error(obj);
    }
    if (bcrypt.compareSync(newPassword, user.email.password)) {
      const obj = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.ERROR_MSGS.OLD_PASSWORD,
      };
      return Response.error(obj);
    }
    const passHash = bcrypt.hashSync(newPassword, 10);
    await UpdateOne(
      "users",
      {
        _id: new ObjectId(userId),
      },
      {
        "email.password": passHash,
        updatedTime: new Date(),
      }
    );
    const obj = {
      res,
      msg: Constant.INFO_MSGS.PASSWORD_CHANGED,
      status: Constant.STATUS_CODE.OK,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error change password", error);
    return handleException(logger, res, error);
  }
};

/**
 * Add Google Calendar
 */
const addGoogleCalendar = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    req.body.ModifiedBy = new ObjectId(userId);
    req.body.organizationId = new ObjectId(organizationId);
    req.body.updatedTime = new Date();

    // Add Calendar
    await UpdateOne("users", { _id: new ObjectId(userId) }, req.body);

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
};



/**
 *  Add/Update a user profile picture
 */
const { uploadFile } = require("../../utility/uploadData");
const addProfilePicture = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    // if (req.files === undefined || req.files === null || !req.files.picture) {
    //   const obj = {
    //     res,
    //     status: Constant.STATUS_CODE.BAD_REQUEST,
    //     msg: Constant.ERROR_MSGS.FILE_REQUIRED,
    //   };
    //   return Response.error(obj);
    // }
    const picture = req.body.picture;
    await UpdateOne('users',
      { _id: new ObjectId(userId) },
      { 'profilePicture': picture },
    );
    const obj = {
      res,
      status: Constant.STATUS_CODE.OK,
      msg: Constant.INFO_MSGS.SUCCESSFUL_UPDATE,
    };
    return Response.success(obj);
    // await uploadFile(file, organizationId)
    // .then(async (fileUrl) => {
    //   // //console.log("File URL:", fileUrl);
    //     await UpdateOne('users',
    //     { _id: new ObjectId(userId) },
    //     { 'profilePicture': fileUrl},
    //   );
    //   const obj = {
    //     res,
    //     status: Constant.STATUS_CODE.OK,
    //     msg: Constant.INFO_MSGS.SUCCESSFUL_UPDATE,
    //   };
    //   return Response.success(obj);
    // })
    // .catch((error) => {
    //   //console.log("error", error);
    //   return handleException(logger, res, error);
    // });
  } catch (error) {
    return handleException(logger, res, error);
  }
};
module.exports = {
  getUserProfile,
  getUserProfileById,
  updateUserProfile,
  changePassword,
  addGoogleCalendar,
  addProfilePicture,
};
