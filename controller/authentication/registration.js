const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const moment = require("moment");
const randomString = require("crypto-random-string");
const SignupValidation = require("../../helpers/joi-validation");
const { handleException } = require("../../helpers/exception");
const { createDemoFormByID } = require("../Demo-Form/demoController");
const Response = require("../../helpers/response");
const Constant = require("../../helpers/constant");
const Email = require("../../helpers/email");
const { sendMsg } = require("../../utility/sms");
const Mongodb = require("../../library/mongodb");
const { JWT_SECRET, JWT_SECRET_SSO } = process.env;
const {
  Find,
  UpdateOne,
  Insert,
  FindOne,
  InsertOne,
} = require("../../library/methods");
const ObjectId = require("mongodb").ObjectId;
const {
  EMAIL_VERIFICATION_URL,
  LOGIN_URL,
  EMAIL_VERIFY_TEMPLATE_ID,
  HOME_PAGE_URL,
  WELCOME_EMAIL_TEMPLATE_ID,
  FORGOT_PASSWORD_URL,
  FORGOT_PASSWORD_TEMPLATE_ID,
  OTP_DLT_TEMPLATE_ID,
} = process.env;

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
// const generateJWTToken = async (payload, type, ip) => {
//   const jti = crypto.randomBytes(10).toString("hex");
//   let jtiObject = {};
//   if (type !== "Access") {
//     // payload.exp = 600 * 60; // 90 minutes
//     payload.exp = "1day";
//     jtiObject = {
//       refresh: jti,
//       ip: ip,
//     };
//     await UpdateOne(
//       "users",
//       { _id: payload.userId },
//       { "jti.refresh": jti, "jti.ip": ip, updatedTime: new Date() }
//     );
//   } else {
//     // payload.exp = 600 * 60; // 60 minutes
//     payload.exp = "2day";
//     jtiObject = {
//       access: jti,
//       ip: ip,
//     };
//     await UpdateOne(
//       "users",
//       { _id: payload.userId },
//       { "jti.access": jti, "jti.ip": ip, updatedTime: new Date() }
//     );
//   }
//   return new Promise(async (resolve, reject) => {
//     try {
//       const { name, userId } = payload;
//       const token = jwt.sign(
//         {
//           iss: "CRM",
//           aud: "CRM",
//           userId,
//           name,
//           type,
//           jti,
//         },
//         JWT_SECRET,
//         {
//           expiresIn: payload.exp,
//         }
//       );
//       // const data = await UpdateOne('users', { _id: userId },
//       //     {
//       //         jti:{
//       //             refresh:jtiObject.refresh,
//       //             access:jtiObject.access,
//       //             ip:jtiObject.ip,
//       //         }
//       //     }
//       // );

//       resolve(token);
//     } catch (error) {
//       reject(error.message);
//     }
//   });
// };

// const generateJWTTokenForSSO = async (payload, type, ip, auth = true) => {
//   const jti = crypto.randomBytes(10).toString("hex");
//   let jtiObject = {};
//   if (type !== "Access") {
//     // payload.exp = auth ? 2 * 60 : 90 * 60; // 90 minutes
//     payload.exp = "1day";
//     jtiObject = {
//       refresh: jti,
//       ip: ip,
//     };
//     await UpdateOne(
//       "users",
//       { _id: payload.userId },
//       { "jti.refresh": jti, "jti.ip": ip, updatedTime: new Date() }
//     );
//   } else {
//     // payload.exp = 60 * 60; // 60 minutes
//     payload.exp = "2day";
//     jtiObject = {
//       access: jti,
//       ip: ip,
//     };
//     await UpdateOne(
//       "users",
//       { _id: payload.userId },
//       { "jti.access": jti, "jti.ip": ip, updatedTime: new Date() }
//     );
//   }
//   return new Promise(async (resolve, reject) => {
//     try {
//       const { name, userId } = payload;
//       const token = jwt.sign(
//         {
//           iss: "CRM",
//           aud: "CRM",
//           userId,
//           name,
//           type,
//           jti,
//         },
//         JWT_SECRET_SSO,
//         {
//           expiresIn: payload.exp,
//         }
//       );

//       resolve(token);
//     } catch (error) {
//       reject(error.message);
//     }
//   });
// };
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

// const commonAuth = (logger, name, userId, ip, type) =>
//   new Promise(async (resolve, reject) => {
//     try {
//       if (!type) {
//         const payload = {
//           exp: 15 * 60, // 10 minutes
//           name,
//           userId,
//         };
//         const accessToken = await generateJWTToken(payload, "Access", ip);
//         const refreshToken = await generateJWTToken(payload, "Refresh", ip);
//         const data = {
//           accessToken,
//           refreshToken,
//         };
//         resolve(data);
//       } else if (type === "landscap") {
//         const payload = {
//           exp: 2 * 60, // 10 minutes
//           name,
//           userId,
//         };
//         const accessToken = await generateJWTTokenForSSO(payload, "Access", ip);
//         const refreshToken = await generateJWTTokenForSSO(
//           payload,
//           "Refresh",
//           ip
//         );
//         const data = {
//           accessToken,
//           refreshToken,
//         };
//         resolve(data);
//       }
//     } catch (error) {
//       //console.log("common Auth Log :", error);
//       reject(error);
//     }
//   });

/**
 * Register a new user with email and password
 */
const registerWithEmailAndPassword = async (req, res) => {
  const { logger } = req;
  try {
    const { firstName, lastName, email, password, mobile, organizationName } =
      req.body;

    const { error } = SignupValidation.registerWithEmailAndPassword({
      firstName,
      lastName,
      email,
      password,
    });
    if (error) {
      const obj = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: error.details[0].message,
      };
      return Response.error(obj);
    }

    const organizationInfo = await FindOne("organization", {
      organizationName,
    });
    if (organizationInfo) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.ERROR_MSGS.ORGANIZATION_EXISTS,
      };
      return Response.error(resp);
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
    const passwordHash = bcrypt.hashSync(password, 10);
    // //console.log('passwordHash', passwordHash)

    // Email Token Verification
    const token = randomString({
      length: 15,
      type: "url-safe",
    });

    var OtpCode = Math.floor(1000 + Math.random() * 9000);
    // //console.log("otp---->", otp);

    // SMS Send
    let smsPayload = {
      message: `Your Login OTP is ${OtpCode}, Please Do not Share anyone. - InFutive`,
      template_id: OTP_DLT_TEMPLATE_ID,
      mobile,
    };
    sendMsg(smsPayload);

    // Create User Document in Mongodb
    const organizationData = await InsertOne("organization", {
      organizationName,
      sms_service: false,
      email_service: false,
      whatsapp_service: false,
      createdTime: new Date(),
      updatedTime: new Date(),
    });
    //console.log('organizationData', organizationData)
    // Create User Document in Mongodb
    await InsertOne("users", {
      // name,
      firstName,
      lastName,
      is_active: true,
      organizationId: new ObjectId(organizationData.insertedId),
      otp: {
        // code: OtpCode,
        code: 1111,
        verified: false,
      },
      email: {
        id: email,
        mobile,
        verified: false,
        registrationType: "Email",
        password: passwordHash,
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
      createdTime: new Date(),
      updatedTime: new Date(),
    });
    // Send Response To Client

    // let emailPayload = {
    //     firstName,
    //     email,
    //     verifyLink: `${EMAIL_VERIFICATION_URL}${token}`,
    //     loginLink: `${LOGIN_URL}`,
    // };
    // Email.Email(logger, EMAIL_VERIFY_TEMPLATE_ID, email, emailPayload);

    const obj = {
      res,
      status: Constant.STATUS_CODE.CREATED,
      msg: Constant.INFO_MSGS.VERIFICATION_OTP,
      data: {
        _id: organizationData.insertedId,
        firstName,
        email,
      },
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error--->", error);
    return handleException(logger, res, error);
  }
};

const encrypt = (plainText, password) => {
  try {
    const iv = crypto.randomBytes(16);
    const key = crypto
      .createHash("sha256")
      .update(password)
      .digest("base64")
      .substr(0, 32);
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

    let encrypted = cipher.update(plainText);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
  } catch (error) {
    console.log(error);
  }
};

const decrypt = (encryptedText, password) => {
  try {
    const textParts = encryptedText.split(":");
    const iv = Buffer.from(textParts.shift(), "hex");

    const encryptedData = Buffer.from(textParts.join(":"), "hex");
    const key = crypto
      .createHash("sha256")
      .update(password)
      .digest("base64")
      .substr(0, 32);
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);

    const decrypted = decipher.update(encryptedData);
    const decryptedText = Buffer.concat([decrypted, decipher.final()]);
    //console.log(decryptedText);
    return decryptedText.toString();
  } catch (error) {
    return "test";
    return error;
    //console.log(error);
  }
};


//Organizationa and employee registrations
const registerWithEmail = async (req, res) => {
  const { logger } = req;
  try {
    const decText = req.body.encrypted;
    const type = req.query.type;

    if (decText !== "78802769e8945d0c413c510e69bbc0cc:d6e6f7c96d5efbe24eba204b432601c7") {
      return Response.error({ res, status: Constant.STATUS_CODE.BAD_REQUEST, msg: Constant.INFO_MSGS.NO_ENCRYPT });
    }

    let { firstName, lastName, email, password, mobile, organizationName, roleTitle, indystry, CompanyCIN } = req.body;

    if (CompanyCIN === undefined || CompanyCIN === null || CompanyCIN === "") {
      return Response.error({ res, status: Constant.STATUS_CODE.BAD_REQUEST, msg: "Company CIN is required" });
    }
    if (organizationName === undefined || organizationName === null || organizationName === "") {
      return Response.error({ res, status: Constant.STATUS_CODE.BAD_REQUEST, msg: "organizationName CIN is required" });
    }
    if (firstName === undefined || firstName === null || firstName === "") {
      return Response.error({ res, status: Constant.STATUS_CODE.BAD_REQUEST, msg: "firstName CIN is required" });
    }
    if (lastName === undefined || lastName === null || lastName === "") {
      return Response.error({ res, status: Constant.STATUS_CODE.BAD_REQUEST, msg: "lastName CIN is required" });
    }

    const industry = indystry || "coworking";
    firstName = firstName.split(" ")[0];
    lastName = lastName.split(" ")[lastName.split(" ").length - 1];
    const { error } = SignupValidation.registerWithEmailAndPassword({ firstName, lastName, email, password, organizationName });
    if (error) {
      return Response.error({ res, status: Constant.STATUS_CODE.BAD_REQUEST, msg: error.details[0].message });
    }

    let organizationData = await FindOne("organization", { organizationName, CompanyCIN });

    if (!organizationData) {
      roleTitle = "CEO";
      organizationData = await InsertOne("organization", {
        organizationName,
        CompanyCIN,
        sms_service: false,
        email_service: false,
        whatsapp_service: false,
        createdTime: new Date(),
        updatedTime: new Date(),
      });
      organizationData = await FindOne("organization", { organizationName, CompanyCIN });
      // console.log("AAA", organizationData);
    } else if (organizationData && roleTitle === "CEO") {
      // console.log("ORG", organizationData)
      roleTitle = "User";
    } else {
      roleTitle = "User";
    }

    const userEmailExists = await FindOne("users", { "email.id": email, "organizationId": organizationData._id });
    if (userEmailExists) {
      return Response.error({ res, status: Constant.STATUS_CODE.BAD_REQUEST, msg: Constant.ERROR_MSGS.ACCOUNT_EMAIL_EXISTS });
    }

    const userMobileExists = await FindOne("users", { "email.mobile": mobile, "organizationId": organizationData._id });
    if (userMobileExists) {
      return Response.error({ res, status: Constant.STATUS_CODE.BAD_REQUEST, msg: Constant.ERROR_MSGS.ACCOUNT_MOBILE_EXISTS });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const token = randomString({ length: 15, type: "url-safe" });
    const otpCode = 1111; // For demo purposes, this should be replaced with actual OTP generation logic

    // sendMsg({ message: `Your Login OTP is ${otpCode}, Please Do not Share anyone. - InFutive`, template_id: OTP_DLT_TEMPLATE_ID, mobile });

    const userInsertData = {
      firstName,
      lastName,
      is_active: true,
      organizationId: new ObjectId(organizationData._id),
      otp: { code: otpCode, verified: true },
      email: { id: email, mobile, verified: true, registrationType: "Email", password: passwordHash, token: { token, createdAt: Date.now() } },
      status: true,
      blocked: { status: false, expiry: null },
      jti: { access: null, refresh: null, ip: null },
      createdTime: new Date(),
      updatedTime: new Date(),
    };



    const udata = await InsertOne("users", userInsertData);
    const clientIp = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    const data = await commonAuth(logger, firstName, udata.insertedId, clientIp, "landscap", roleTitle, organizationData._id);
    let roleData = await FindOne('roles', { roleTitle: "CEO", organizationId: new ObjectId(organizationData._id) });
    if (roleData) {
      const roleExists = await FindOne('roles', { roleTitle, parent_id: new ObjectId(roleData._id), organizationId: new ObjectId(organizationData._id) });
      if (!roleExists) {
        roleData = await InsertOne("roles", { roleTitle, parent_id: new ObjectId(roleData._id), organizationId: new ObjectId(organizationData._id), createdBy: null, createdTime: new Date(), updatedTime: new Date() });
      } else {
        roleData = roleExists;
      }
      console.log("RoleData", roleData)
    } else if (roleTitle === "CEO" || roleTitle === undefined) {
      roleData = await InsertOne("roles", { roleTitle: "CEO", parent_id: null, organizationId: new ObjectId(organizationData._id), createdBy: null, createdTime: new Date(), updatedTime: new Date() });
    } else {
      roleData = await FindOne('roles', { roleTitle: roleTitle, organizationId: new ObjectId(organizationData._id) });
    }
    console.log("RoleData", roleData)
    const ProfilePayload = {
      profileTitle: "Administrator",
      profileDescription: "Full Access",
      roleTitle: roleTitle,
      roleId: roleData?._id ?? roleData?.insertedId,
      permission: [
        {
          module_title: "home",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "leads",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "contacts",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "accounts",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "opportunities",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "tasks",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "Calls",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "meeting",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "saleOrders",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "purchaseOrders",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "invoices",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "inventory",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "Quotes",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "Quote",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "vendor",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "siteVisit",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "Note",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "whatsapp",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "sms",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "settings",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "dataBackup",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "dataExport",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "sampleData",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "storage",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "recycleBin",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "auditLog",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "quotes",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },

        {
          module_title: "channelPartner",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
      ],
      organizationId: new ObjectId(organizationData._id),
      createdByUser: new ObjectId(udata.insertedId),
      createdTime: new Date(),
      updatedTime: new Date(),
    };

    const ProfileCreate = await InsertOne("permissionProfile", ProfilePayload);

    const dashboardData = {
      name: "My Dashboard",
      description: "My Dashboard",
      roles: ["661f7410601b80f0cbe557dd"],
      dashboard: [
        {
          name: "Untouched Meeting",
          value: "UnTuch",
          module: "Meeting",
        },
        {
          name: "Untouched Calls",
          value: "UnTuch",
          module: "Calls",
        },
        {
          name: "All Leads",
          value: "All",
          module: "Leads",
        },
        {
          name: "All Opportunities",
          value: "All",
          module: "Opportunities",
        },
        {
          name: "Untouched siteVisit",
          value: "UnTuch",
          module: "siteVisit",
        },
        {
          name: "Touched Leads",
          value: "Tuch",
          module: "Leads",
        },
        {
          name: "Touched Opportunities",
          value: "Tuch",
          module: "Opportunities",
        },
      ],
      userId: new ObjectId(udata.insertedId),
      organizationId: new ObjectId(organizationData._id),
      createdAt: new Date(),
      updatedTime: new Date(),
    };

    await InsertOne("customizeDashboard", dashboardData);


    const paylaodFormCreate = { organizationId: organizationData._id, userId: udata.insertedId, industry };

    await createDemoFormByID(logger, paylaodFormCreate);

    await UpdateOne("users", { _id: new ObjectId(udata.insertedId) }, { profile: new ObjectId(ProfileCreate.insertedId) });

    data.userData = { email: { verified: true }, roleTitle, profile: ProfileCreate.insertedId, _id: udata.insertedId };

    return Response.success({ res, msg: Constant.INFO_MSGS.SUCCESSFUL_LOGIN, status: Constant.STATUS_CODE.OK, data });
  } catch (error) {
    console.log("ERROR", error)
    return handleException(logger, res, error);
  }
};

//new register
const registerUser = async (req, res) => {
  const { logger } = req;
  try {
    // const decText1 = encrypt("athmrccrypt", "AUTHMRCHTUA");
    // console.log(decText1);
    // const decText = decrypt(req.body.encrypted, "AUTHMRCHTUA");

    const decText = req.body.encrypted;
    const type = req.query.type;
    // const clientIp =
    //   req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    if (
      decText !=
      "78802769e8945d0c413c510e69bbc0cc:d6e6f7c96d5efbe24eba204b432601c7"
    ) {
      // console.log("test===", decText, "athmrccrypt");
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.INFO_MSGS.NO_ENCRYPT,
      };
      return Response.error(resp);
    }
    const { firstName, lastName, email, password, mobile, organizationName } =
      req.body;

    const { error } = SignupValidation.registerWithEmailAndPassword({
      firstName,
      lastName,
      email,
      password,
    });
    if (error) {
      const obj = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: error.details[0].message,
      };
      return Response.error(obj);
    }

    const organizationInfo = await FindOne("organization", {
      organizationName,
    });
    if (organizationInfo) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.ERROR_MSGS.ORGANIZATION_EXISTS,
      };
      return Response.error(resp);
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
    const passwordHash = bcrypt.hashSync(password, 10);
    // //console.log('passwordHash', passwordHash)

    // Email Token Verification
    const token = randomString({
      length: 15,
      type: "url-safe",
    });

    var OtpCode = Math.floor(1000 + Math.random() * 9000);
    // //console.log("otp---->", otp);

    // SMS Send
    let smsPayload = {
      message: `Your Login OTP is ${OtpCode}, Please Do not Share anyone. - InFutive`,
      template_id: OTP_DLT_TEMPLATE_ID,
      mobile,
    };
    sendMsg(smsPayload);

    // Create User Document in Mongodb
    const organizationData = await InsertOne("organization", {
      organizationName,
      sms_service: false,
      email_service: false,
      whatsapp_service: false,
      createdTime: new Date(),
      updatedTime: new Date(),
    });

    console.log("organizationData", organizationData);

    // await InsertOne("permissionProfile", {
    //   Administrator,
    //   permission,
    //   profileDescription,
    //   organizationId: new ObjectId(organizationId),
    //   createdByUser: new ObjectId(userId),
    //   createdTime: new Date(),
    //   updatedTime: new Date(),
    // });

    //console.log('organizationData', organizationData)
    // Create User Document in Mongodb

    // console.log("udata", smsPayload);

    var udata = await InsertOne("users", {
      // name,
      firstName,
      lastName,
      is_active: true,
      organizationId: new ObjectId(organizationData.insertedId),
      otp: {
        // code: OtpCode,
        code: 1111,
        verified: true,
      },
      email: {
        id: email,
        mobile,
        verified: true,
        registrationType: "Email",
        password: passwordHash,
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
      createdTime: new Date(),
      updatedTime: new Date(),
    });

    const userAgent = req.headers["user-agent"];
    const clientIp =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    LogPayload = {
      userAgent,
      clientIp,
      userInfo,
    };

    // const data = await commonAuth(
    //   logger,
    //   firstName,
    //   udata.insertedId,
    //   clientIp,
    //   "landscap"
    // );

    const data = await commonAuth(
      logger,
      firstName,
      udata.insertedId,
      clientIp,
      "landscap"
    );

    console.log("udata", udata);

    let ProfilePayload = {
      profileTitle: "Administrator",
      profileDescription: "Full Access",
      permission: [
        {
          module_title: "home",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "leads",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "contacts",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "accounts",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "opportunities",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "tasks",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "Calls",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "meeting",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "saleOrders",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "purchaseOrders",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "invoices",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "inventory",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "Quotes",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "Quote",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "vendor",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "siteVisit",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "Note",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "whatsapp",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "sms",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "settings",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "dataBackup",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "dataExport",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "sampleData",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "storage",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "recycleBin",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "auditLog",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "quotes",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },

        {
          module_title: "channelPartner",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
      ],
    };

    ProfilePayload.organizationId = new ObjectId(organizationData.insertedId);
    ProfilePayload.createdByUser = new ObjectId(udata.insertedId);
    ProfilePayload.createdTime = new Date();
    ProfilePayload.updatedTime = new Date();

    //console.log("ProfilePayload", ProfilePayload);
    const ProfileCreate = await InsertOne("permissionProfile", ProfilePayload);
    //console.log("ProfilePayloadinsert", ProfileCreate);

    //  if (req.body.roles.length) {
    //    req.body.roles = req.body.roles.map((e) => new ObjectId(e));
    //  }

    // Create CustomizeDashboard
    let dashboardData = {
      name: "My Dashboard",
      description: "My Dashboard",
      roles: ["661f7410601b80f0cbe557dd"],
      dashboard: [
        {
          name: "Untouched Meeting",
          value: "UnTuch",
          module: "Meeting",
        },
        {
          name: "Untouched Calls",
          value: "UnTuch",
          module: "Calls",
        },
        {
          name: "All Leads",
          value: "All",
          module: "Leads",
        },
        {
          name: "All Opportunities",
          value: "All",
          module: "Opportunities",
        },
        {
          name: "Untouched siteVisit",
          value: "UnTuch",
          module: "siteVisit",
        },
        {
          name: "Touched Leads",
          value: "Tuch",
          module: "Leads",
        },
        {
          name: "Touched Opportunities",
          value: "Tuch",
          module: "Opportunities",
        },
      ],
    };
    //  ProfilePayload.organizationId = new ObjectId(organizationData.insertedId);
    //  ProfilePayload.createdByUser = new ObjectId(udata.insertedId);
    dashboardData.userId = new ObjectId(udata.insertedId);
    dashboardData.organizationId = new ObjectId(organizationData.insertedId);
    dashboardData.createdAt = new Date();
    dashboardData.updatedTime = new Date();

    await InsertOne("customizeDashboard", dashboardData);

    console.log(req.body);

    let indystry = req.body.indystry; //= udata.indystry;
    if (!indystry) {
      indystry = "coworking";
    }
    let paylaodFormCreate = {
      organizationId: organizationData.insertedId,
      userId: udata.insertedId,
      indystry: indystry,
    };
    await createDemoFormByID(logger, paylaodFormCreate);

    const rolesData = await InsertOne("roles", {
      roleTitle: "CEO",
      parent_id: null,
      organizationId: new ObjectId(organizationData.insertedId),
      createdBy: null,
      createdTime: new Date(),
      updatedTime: new Date(),
    });

    await UpdateOne(
      "users",
      { _id: new ObjectId(udata.insertedId) },
      {
        profile: new ObjectId(ProfileCreate.insertedId),
      }
    );
    const userData = {
      email: {
        verified: true,
      },
      roleTitle: "CEO",
      profile: ProfileCreate.insertedId,
      //profile_id: ProfileCreate.insertedId,
      _id: udata.insertedId,
      // orgInfo,
      // role: userInfo.role,
    };

    const userDatap = await FindOne("organization", {
      _id: new ObjectId(organizationData.insertedId),
    });
    //console.log("userDatap", userDatap);

    if (!userDatap) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.ERROR_MSGS.ACCOUNT_NOT_FOUND,
      };
      return Response.error(resp);
    }

    // let packagedt = {
    //   package: {
    //     value: "65c4633864fd3cd2ee46fa65",
    //     label: "Full package",
    //     _id: "65c4633864fd3cd2ee46fa65",
    //     packageTitle: "Full package",
    //     packageAmount: 10000,
    //     packageMonths: 36,
    //     packageNoOfUser: "1200",
    //     packageDesc: "Full package",
    //     basicPermissions: [
    //       {
    //         name: "Lead",
    //         access: true,
    //       },
    //       {
    //         name: "Contact",
    //         access: true,
    //       },
    //       {
    //         name: "Account",
    //         access: true,
    //       },
    //       {
    //         name: "Opportunities",
    //         access: true,
    //       },
    //       {
    //         name: "Calls",
    //         access: true,
    //       },
    //       {
    //         name: "Meetings",
    //         access: true,
    //       },
    //       {
    //         name: "Tasks",
    //         access: true,
    //       },
    //       {
    //         name: "Site Visits",
    //         access: true,
    //       },
    //       {
    //         name: "Filters and Pipelines",
    //         access: true,
    //       },
    //       {
    //         name: "Assignment Rule",
    //         access: true,
    //       },
    //       {
    //         name: "Email Integration",
    //         access: true,
    //       },
    //       {
    //         name: "Dashboards - Analytics",
    //         access: true,
    //       },
    //       {
    //         name: "Reports",
    //         access: true,
    //       },
    //       {
    //         name: "Custom fields - max 10 per module",
    //         access: true,
    //       },
    //     ],
    //     advancePermissions: [
    //       {
    //         name: "Workflows",
    //         access: true,
    //       },
    //       {
    //         name: "Blueprints",
    //         access: true,
    //       },
    //       {
    //         name: "Social Integrations",
    //         access: true,
    //       },
    //       {
    //         name: "Unlimited Custom fields",
    //         access: true,
    //       },
    //       {
    //         name: "Home Page customizations",
    //         access: true,
    //       },
    //       {
    //         name: "Case Escalation",
    //         access: true,
    //       },
    //       {
    //         name: "Approval Processes",
    //         access: true,
    //       },
    //       {
    //         name: "Audit Log",
    //         access: true,
    //       },
    //       {
    //         name: "Territory Management",
    //         access: true,
    //       },
    //     ],
    //     permission: [
    //       {
    //         name: "Workflows",
    //         access: true,
    //       },
    //       {
    //         name: "Blueprints",
    //         access: true,
    //       },
    //       {
    //         name: "Social Integrations",
    //         access: true,
    //       },
    //       {
    //         name: "Unlimited Custom fields",
    //         access: true,
    //       },
    //       {
    //         name: "Home Page customizations",
    //         access: true,
    //       },
    //       {
    //         name: "Case Escalation",
    //         access: true,
    //       },
    //       {
    //         name: "Approval Processes",
    //         access: true,
    //       },
    //       {
    //         name: "Audit Log",
    //         access: true,
    //       },
    //       {
    //         name: "Territory Management",
    //         access: true,
    //       },
    //     ],
    //   },
    //   Industry: "Residential Broker",
    // };

    // if (packagedt) {
    //   packagedt.start_date = new Date();
    //   packagedt.end_date = new Date(
    //     moment().add(req.body.package.packageMonths, "months").format()
    //   );
    //   packagedt.is_expired = false;

    //   const packageTrack = packagedt;
    //   delete packageTrack._id;
    //   // old active package expired and active new

    //   await UpdateMany(
    //     "organizationPackageTrack",
    //     { organizationId: new ObjectId(organizationData.insertedId) },
    //     { is_expired: true }
    //   );
    //   // active package add
    //   await InsertOne("organizationPackageTrack", {
    //     organizationId: new ObjectId(organizationData.insertedId),
    //     packageId: new ObjectId(packagedt.package.value),
    //     ...packageTrack,
    //   });
    // }

    // await UpdateOne(
    //   "organization",
    //   { _id: new ObjectId(organizationData.insertedId) },
    //   packagedt
    // );

    data.userData = userData;
    const obj = {
      res,
      msg: Constant.INFO_MSGS.SUCCESSFUL_LOGIN,
      status: Constant.STATUS_CODE.OK,
      data,
    };

    return Response.success(obj);
  } catch (error) {
    //console.log("error--->", error);
    return handleException(logger, res, error);
  }
};

//new Seals Person register
const registerSPWithEmail = async (req, res) => {
  const { logger } = req;

  try {
    const decText = req.body.encrypted;
    const { firstName, lastName, email, password, mobile, organizationName, roleTitle } = req.body;

    if (decText !== "78802769e8945d0c413c510e69bbc0cc:d6e6f7c96d5efbe24eba204b432601c7") {
      return Response.error({ res, status: Constant.STATUS_CODE.BAD_REQUEST, msg: Constant.INFO_MSGS.NO_ENCRYPT });
    }

    const { error } = SignupValidation.registerWithEmailAndPassword({ firstName, lastName, email, password, organizationName });
    if (error) {
      return Response.error({ res, status: Constant.STATUS_CODE.BAD_REQUEST, msg: error.details[0].message });
    }

    const organizationData = await FindOne("organization", { organizationName });
    if (!organizationData) {
      return Response.error({ res, status: Constant.STATUS_CODE.BAD_REQUEST, msg: Constant.ERROR_MSGS.ORGANIZATION_EXISTS });
    }

    const userEmailExists = await FindOne("users", { "email.id": email, "organizationName": organizationName });
    if (userEmailExists) {
      return Response.error({ res, status: Constant.STATUS_CODE.BAD_REQUEST, msg: Constant.ERROR_MSGS.ACCOUNT_EMAIL_EXISTS });
    }

    const userMobileExists = await FindOne("users", { "email.mobile": mobile, "organizationName": organizationName });
    if (userMobileExists) {
      return Response.error({ res, status: Constant.STATUS_CODE.BAD_REQUEST, msg: Constant.ERROR_MSGS.ACCOUNT_MOBILE_EXISTS });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const token = randomString({ length: 15, type: "url-safe" });
    const otpCode = 1111; // For demo purposes, this should be replaced with actual OTP generation logic

    sendMsg({ message: `Your Login OTP is ${otpCode}, Please Do not Share anyone. - InFutive`, template_id: OTP_DLT_TEMPLATE_ID, mobile });

    const userInsertData = {
      firstName,
      lastName,
      is_active: true,
      organizationId: new ObjectId(organizationData._id),
      otp: { code: otpCode, verified: true },
      email: { id: email, mobile, verified: true, registrationType: "Email", password: passwordHash, token: { token, createdAt: Date.now() } },
      status: true,
      blocked: { status: false, expiry: null },
      jti: { access: null, refresh: null, ip: null },
      createdTime: new Date(),
      updatedTime: new Date(),
    };

    const udata = await InsertOne("users", userInsertData);
    const clientIp = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    const data = await commonAuth(logger, firstName, udata.insertedId, clientIp, "landscap");

    const ProfilePayload = {
      profileTitle: "Administrator",
      profileDescription: "Full Access",
      permission: [
        {
          module_title: "home",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "leads",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "contacts",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "accounts",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "opportunities",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "tasks",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "Calls",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "meeting",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "saleOrders",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "purchaseOrders",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "invoices",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "inventory",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "Quotes",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "Quote",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "vendor",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "siteVisit",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "Note",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "whatsapp",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "sms",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "settings",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "dataBackup",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "dataExport",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "sampleData",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "storage",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "recycleBin",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "auditLog",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
        {
          module_title: "quotes",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },

        {
          module_title: "channelPartner",
          module_permission: {
            read: true,
            write: true,
            delete: true,
            edit: true,
            autoResponders: true,
            excelSheet: true,
          },
        },
      ],
      organizationId: new ObjectId(organizationData._id),
      createdByUser: new ObjectId(udata.insertedId),
      createdTime: new Date(),
      updatedTime: new Date(),
    };

    const ProfileCreate = await InsertOne("permissionProfile", ProfilePayload);

    const dashboardData = {
      name: "My Dashboard",
      description: "My Dashboard",
      roles: ["661f7410601b80f0cbe557dd"],
      dashboard: [
        {
          name: "Untouched Meeting",
          value: "UnTuch",
          module: "Meeting",
        },
        {
          name: "Untouched Calls",
          value: "UnTuch",
          module: "Calls",
        },
        {
          name: "All Leads",
          value: "All",
          module: "Leads",
        },
        {
          name: "All Opportunities",
          value: "All",
          module: "Opportunities",
        },
        {
          name: "Untouched siteVisit",
          value: "UnTuch",
          module: "siteVisit",
        },
        {
          name: "Touched Leads",
          value: "Tuch",
          module: "Leads",
        },
        {
          name: "Touched Opportunities",
          value: "Tuch",
          module: "Opportunities",
        },
      ],
      userId: new ObjectId(udata.insertedId),
      organizationId: new ObjectId(organizationData._id),
      createdAt: new Date(),
      updatedTime: new Date(),
    };

    await InsertOne("customizeDashboard", dashboardData);

    const industry = req.body.indystry || "coworking";
    const paylaodFormCreate = { organizationId: organizationData._id, userId: udata.insertedId, industry };

    await createDemoFormByID(logger, paylaodFormCreate);

    const roleData = await FindOne('roles', { roleTitle: "CEO", organizationId: new ObjectId(organizationData._id) });
    if (roleData) {
      const roleExists = await FindOne('roles', { roleTitle, parent_id: new ObjectId(roleData._id), organizationId: new ObjectId(organizationData._id) });
      if (!roleExists) {
        await InsertOne("roles", { roleTitle, parent_id: new ObjectId(roleData._id), organizationId: new ObjectId(organizationData._id), createdBy: null, createdTime: new Date(), updatedTime: new Date() });
      }
    }

    await UpdateOne("users", { _id: new ObjectId(udata.insertedId) }, { profile: new ObjectId(ProfileCreate.insertedId) });

    data.userData = { email: { verified: true }, roleTitle, profile: ProfileCreate.insertedId, _id: udata.insertedId };

    return Response.success({ res, msg: Constant.INFO_MSGS.SUCCESSFUL_LOGIN, status: Constant.STATUS_CODE.OK, data });
  } catch (error) {
    return handleException(logger, res, error);
  }
};

/**
 * Customer OTP id verification
 *
 * @param {string} token (token)
 */
const OtpVerify = async (req, res) => {
  const { logger } = req;
  try {
    const { OtpCode, mobile } = req.body;
    const { error } = SignupValidation.JoiOTPVerify(req.body);
    if (error) {
      const obj = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: error.details[0].message,
      };
      return Response.error(obj);
    }

    const user = await FindOne("users", {
      "otp.code": OtpCode,
      "email.mobile": mobile,
    });

    if (!user) {
      const obj = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.ERROR_MSGS.INVALID_OTP,
      };
      return Response.error(obj);
    } else if (user.otp.verified) {
      const obj = {
        res,
        status: Constant.STATUS_CODE.OK,
        msg: Constant.INFO_MSGS.OTP_VERIFIED,
      };
      return Response.success(obj);
    } else {
      let ProfilePayload = {
        profileTitle: "Administrator",
        profileDescription: "Full Access",
        permission: [
          {
            module_title: "home",
            module_permission: {
              read: true,
              write: true,
              delete: true,
              edit: true,
              autoResponders: true,
              excelSheet: true,
            },
          },
          {
            module_title: "leads",
            module_permission: {
              read: true,
              write: true,
              delete: true,
              edit: true,
              autoResponders: true,
              excelSheet: true,
            },
          },
          {
            module_title: "contacts",
            module_permission: {
              read: true,
              write: true,
              delete: true,
              edit: true,
              autoResponders: true,
              excelSheet: true,
            },
          },
          {
            module_title: "accounts",
            module_permission: {
              read: true,
              write: true,
              delete: true,
              edit: true,
              autoResponders: true,
              excelSheet: true,
            },
          },
          {
            module_title: "opportunities",
            module_permission: {
              read: true,
              write: true,
              delete: true,
              edit: true,
              autoResponders: true,
              excelSheet: true,
            },
          },
          {
            module_title: "tasks",
            module_permission: {
              read: true,
              write: true,
              delete: true,
              edit: true,
              autoResponders: true,
              excelSheet: true,
            },
          },
          {
            module_title: "Calls",
            module_permission: {
              read: true,
              write: true,
              delete: true,
              edit: true,
              autoResponders: true,
              excelSheet: true,
            },
          },
          {
            module_title: "meeting",
            module_permission: {
              read: true,
              write: true,
              delete: true,
              edit: true,
              autoResponders: true,
              excelSheet: true,
            },
          },
          {
            module_title: "saleOrders",
            module_permission: {
              read: true,
              write: true,
              delete: true,
              edit: true,
              autoResponders: true,
              excelSheet: true,
            },
          },
          {
            module_title: "purchaseOrders",
            module_permission: {
              read: true,
              write: true,
              delete: true,
              edit: true,
              autoResponders: true,
              excelSheet: true,
            },
          },
          {
            module_title: "invoices",
            module_permission: {
              read: true,
              write: true,
              delete: true,
              edit: true,
              autoResponders: true,
              excelSheet: true,
            },
          },
          {
            module_title: "inventory",
            module_permission: {
              read: true,
              write: true,
              delete: true,
              edit: true,
              autoResponders: true,
              excelSheet: true,
            },
          },
          {
            module_title: "quotes",
            module_permission: {
              read: true,
              write: true,
              delete: true,
              edit: true,
              autoResponders: true,
              excelSheet: true,
            },
          },
          {
            module_title: "quote",
            module_permission: {
              read: true,
              write: true,
              delete: true,
              edit: true,
              autoResponders: true,
              excelSheet: true,
            },
          },
          {
            module_title: "vendor",
            module_permission: {
              read: true,
              write: true,
              delete: true,
              edit: true,
              autoResponders: true,
              excelSheet: true,
            },
          },
          {
            module_title: "siteVisit",
            module_permission: {
              read: true,
              write: true,
              delete: true,
              edit: true,
              autoResponders: true,
              excelSheet: true,
            },
          },
          {
            module_title: "Note",
            module_permission: {
              read: true,
              write: true,
              delete: true,
              edit: true,
              autoResponders: true,
              excelSheet: true,
            },
          },
          {
            module_title: "whatsapp",
            module_permission: {
              read: true,
              write: true,
              delete: true,
              edit: true,
              autoResponders: true,
              excelSheet: true,
            },
          },
          {
            module_title: "sms",
            module_permission: {
              read: true,
              write: true,
              delete: true,
              edit: true,
              autoResponders: true,
              excelSheet: true,
            },
          },
          {
            module_title: "settings",
            module_permission: {
              read: true,
              write: true,
              delete: true,
              edit: true,
              autoResponders: true,
              excelSheet: true,
            },
          },
          {
            module_title: "dataBackup",
            module_permission: {
              read: true,
              write: true,
              delete: true,
              edit: true,
              autoResponders: true,
              excelSheet: true,
            },
          },
          {
            module_title: "dataExport",
            module_permission: {
              read: true,
              write: true,
              delete: true,
              edit: true,
              autoResponders: true,
              excelSheet: true,
            },
          },
          {
            module_title: "sampleData",
            module_permission: {
              read: true,
              write: true,
              delete: true,
              edit: true,
              autoResponders: true,
              excelSheet: true,
            },
          },
          {
            module_title: "storage",
            module_permission: {
              read: true,
              write: true,
              delete: true,
              edit: true,
              autoResponders: true,
              excelSheet: true,
            },
          },
          {
            module_title: "recycleBin",
            module_permission: {
              read: true,
              write: true,
              delete: true,
              edit: true,
              autoResponders: true,
              excelSheet: true,
            },
          },
          {
            module_title: "auditLog",
            module_permission: {
              read: true,
              write: true,
              delete: true,
              edit: true,
              autoResponders: true,
              excelSheet: true,
            },
          },
          {
            module_title: "quotes",
            module_permission: {
              read: true,
              write: true,
              delete: true,
              edit: true,
              autoResponders: true,
              excelSheet: true,
            },
          },

          {
            module_title: "channelPartner",
            module_permission: {
              read: true,
              write: true,
              delete: true,
              edit: true,
              autoResponders: true,
              excelSheet: true,
            },
          },
        ],
      };

      ProfilePayload.organizationId = new ObjectId(user.organizationId);
      ProfilePayload.createdByUser = new ObjectId(user._id);
      ProfilePayload.createdTime = new Date();
      ProfilePayload.updatedTime = new Date();
      const ProfileCreate = await InsertOne(
        "permissionProfile",
        ProfilePayload
      );

      let paylaodFormCreate = {
        organizationId: user.organizationId,
        userId: user._id,
        indystry: "coworking",
      };
      await createDemoFormByID(logger, paylaodFormCreate);

      const rolesData = await InsertOne("roles", {
        roleTitle: "CEO",
        parent_id: null,
        organizationId: new ObjectId(user.organizationId),
        createdBy: null,
        createdTime: new Date(),
        updatedTime: new Date(),
      });
      // Update User Status
      await UpdateOne(
        "users",
        { _id: user._id },
        {
          "email.verified": true,
          "otp.verified": true,
          profile: new ObjectId(ProfileCreate.insertedId),
          role: new ObjectId(rolesData.insertedId),
          roleTitle: "CEO",
          updatedTime: new Date(),
        }
      );

      const payload = {
        name: user.name,
        homePageLink: `${HOME_PAGE_URL}`,
      };
      Email.Email(logger, WELCOME_EMAIL_TEMPLATE_ID, user.email.id, payload);

      const obj = {
        res,
        msg: Constant.INFO_MSGS.SUCCESSFUL_OTP_VERIFIED,
        status: Constant.STATUS_CODE.OK,
      };
      return Response.success(obj);
    }
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

/**
 * Customer OTP Resend
 *
 * @param {string} token (token)
 */
const otpReSend = async (req, res) => {
  const { logger } = req;
  try {
    const { mobile } = req.body;

    const user = await FindOne("users", { "email.mobile": mobile });
    //console.log(user);
    if (!user) {
      const obj = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.ERROR_MSGS.MOBILE_NOT_FOUND,
      };
      return Response.error(obj);
    }

    var OtpCode = Math.floor(1000 + Math.random() * 9000);
    // //console.log("otp---->", otp);

    // SMS Send
    let smsPayload = {
      message: `Your Login OTP is ${OtpCode}, Please Do not Share anyone. - InFutive`,
      template_id: OTP_DLT_TEMPLATE_ID,
      mobile,
    };
    sendMsg(smsPayload);

    await UpdateOne(
      "users",
      { "email.mobile": mobile },
      {
        "otp.code": OtpCode,
        "otp.verified": false,
        "email.verified": false,
        updatedTime: new Date(),
      }
    );

    const obj = {
      res,
      msg: Constant.INFO_MSGS.VERIFICATION_OTP_RESEND,
      status: Constant.STATUS_CODE.OK,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

/**
 * Customer Email id verification
 *
 * @param {string} token (token)
 */
const emailVerify = async (req, res) => {
  const { logger } = req;
  try {
    const { error } = SignupValidation.tokenVerification(req.body);
    if (error) {
      const obj = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: error.details[0].message,
      };
      return Response.error(obj);
    }

    const user = await FindOne("users", { "email.token.token": code });

    if (!user) {
      const obj = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.ERROR_MSGS.INVALID_CODE,
      };
      return Response.error(obj);
    } else if (user.email.verified) {
      const obj = {
        res,
        status: Constant.STATUS_CODE.OK,
        msg: Constant.INFO_MSGS.EMAIL_VERIFIED,
      };
      return Response.success(obj);
    } else {
      // Create Roles
      const rolesData = await InsertOne("roles", {
        roleTitle: "CEO",
        parent_id: 0,
        organizationId: new ObjectId(user.organizationId),
        createdBy: null,
        createdTime: new Date(),
        updatedTime: new Date(),
      });
      // Update User Status
      await UpdateOne(
        "users",
        { _id: user._id },
        {
          "email.verified": true,
          role: new ObjectId(rolesData.insertedId),
          roleTitle: "CEO",
          updatedTime: new Date(),
        }
      );

      const payload = {
        name: user.name,
        homePageLink: `${HOME_PAGE_URL}`,
      };
      Email.Email(logger, WELCOME_EMAIL_TEMPLATE_ID, user.email.id, payload);
      const obj = {
        res,
        msg: Constant.INFO_MSGS.ACCOUNT_VERIFIED,
        status: Constant.STATUS_CODE.OK,
        data: {
          name: user.name,
          email: user.email.id,
        },
      };

      return Response.success(obj);
    }
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

/**
 * Resend Email verification link
 *
 * @param {string} email (Email ID)
 */
const resendEmailVerification = async (req, res) => {
  const { logger } = req;
  try {
    const { error } = SignupValidation.emailVerification(req.body);
    if (error) {
      const obj = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: error.details[0].message,
      };
      return Response.error(obj);
    }
    const { email } = req.body;
    const user = await FindOne("users", {
      "email.id": email,
    });
    if (!user) {
      const obj = {
        res,
        msg: Constant.ERROR_MSGS.ACCOUNT_NOT_FOUND,
        status: Constant.STATUS_CODE.BAD_REQUEST,
      };
      return Response.error(obj);
    } else if (!user.status) {
      const obj = {
        res,
        msg: Constant.ERROR_MSGS.ACCOUNT_DISABLED,
        status: Constant.STATUS_CODE.BAD_REQUEST,
      };
      return Response.error(obj);
    } else if (user.email.verified) {
      const obj = {
        res,
        msg: Constant.INFO_MSGS.EMAIL_VERIFIED,
        status: Constant.STATUS_CODE.OK,
      };
      return Response.error(obj);
    } else if (user.email.registrationType == "Google") {
      const obj = {
        res,
        msg: Constant.ERROR_MSGS.EMAIL_VERFICATION_NOT_NEEDED,
        status: Constant.STATUS_CODE.OK,
      };
      return Response.error(obj);
    } else {
      const token = randomString({
        length: 15,
        type: "url-safe",
      });
      const userInfo = await UpdateOne(
        "users",
        {
          "email.id": email,
        },
        {
          "email.token.token": token,
          "email.token.createdAt": Date.now(),
          updatedTime: new Date(),
        }
      );

      let emailPayload = {
        name: userInfo.name,
        verifyLink: `${EMAIL_VERIFICATION_URL}${token}`,
        loginLink: `${LOGIN_URL}`,
      };
      Email.Email(logger, EMAIL_VERIFY_TEMPLATE_ID, email, emailPayload);

      const obj = {
        res,
        msg: Constant.INFO_MSGS.VERIFICATION_EMAIL,
        status: Constant.STATUS_CODE.OK,
      };

      return Response.success(obj);
    }
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

/**
 * Send a email with token to the user to reset the password
 *
 * @param {string} email (Email Id)
 */
const forgotPasswordLink = async (req, res) => {
  const { logger } = req;
  try {
    const { email, captchaToken } = req.body;
    // const { error } = SignupValidation.emailVerification({ email });
    // if (error) {
    //     const obj = {
    //         res,
    //         status: Constant.STATUS_CODE.BAD_REQUEST,
    //         msg: error.details[0].message,
    //     };
    //     return Response.error(obj);
    // }

    // const user = await FindOne('users', {
    //     'email.id': email,
    // });
    const user = await FindOne("users", {
      $or: [{ "email.id": email }, { "email.mobile": email }],
    });

    if (!user) {
      const obj = {
        res,
        msg: Constant.ERROR_MSGS.ACCOUNT_NOT_FOUND,
        status: Constant.STATUS_CODE.BAD_REQUEST,
      };
      return Response.error(obj);
    } else if (!user.status) {
      const obj = {
        res,
        msg: Constant.ERROR_MSGS.ACCOUNT_DISABLED,
        status: Constant.STATUS_CODE.BAD_REQUEST,
      };
      return Response.error(obj);
    } else if (user.email.registrationType !== "Email") {
      const obj = {
        res,
        msg: Constant.ERROR_MSGS.CHANGE_PASSWORD_NOT_ALLOWED,
        status: Constant.STATUS_CODE.BAD_REQUEST,
      };
      return Response.error(obj);
    } else if (!user.email.verified) {
      const obj = {
        res,
        msg: Constant.INFO_MSGS.EMAIL_NOT_VERIFIED,
        status: Constant.STATUS_CODE.OK,
      };
      return Response.error(obj);
    } else {
      const token = randomString({
        length: 15,
        type: "url-safe",
      });
      let tokenExpiryDate = moment(new Date(), "MM-DD-YYYY").add(2, "hours");

      const userInfo = await UpdateOne(
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
          updatedTime: new Date(),
        }
      );

      const payload = {
        name: userInfo.name,
        resetPassword: `${FORGOT_PASSWORD_URL}${token}`,
      };
      Email.Email(logger, FORGOT_PASSWORD_TEMPLATE_ID, email, payload);

      const obj = {
        res,
        msg: Constant.INFO_MSGS.EMAIL_SEND,
        status: Constant.STATUS_CODE.OK,
      };
      return Response.success(obj);
    }
  } catch (error) {
    //console.log("forgotPasswordLink error", error);
    return handleException(logger, res, error);
  }
};

/**
 * Change the customer password
 *
 * @param {string} token (forgot password token)
 * @param {string} password (customer password)
 */
const resetPassword = async (req, res) => {
  const { logger } = req;
  try {
    const { code, password } = req.body;

    const user = await FindOne("users", {
      "forgotPassword.token": code,
    });

    if (!user) {
      const obj = {
        res,
        msg: Constant.ERROR_MSGS.INVALID_CODE,
        status: Constant.STATUS_CODE.BAD_REQUEST,
      };
      return Response.error(obj);
    } else if (!user.status) {
      const obj = {
        res,
        msg: Constant.ERROR_MSGS.ACCOUNT_DISABLED,
        status: Constant.STATUS_CODE.BAD_REQUEST,
      };
      return Response.error(obj);
    } else if (!user.email.verified) {
      const obj = {
        res,
        msg: Constant.INFO_MSGS.EMAIL_NOT_VERIFIED,
        status: Constant.STATUS_CODE.OK,
      };
      return Response.error(obj);
    } else if (bcrypt.compareSync(password, user.email.password)) {
      const obj = {
        res,
        msg: Constant.ERROR_MSGS.OLD_PASSWORD,
        status: Constant.STATUS_CODE.BAD_REQUEST,
      };
      return Response.error(obj);
    } else {
      if (user.forgotPassword.expiryDate < new Date()) {
        const obj = {
          res,
          msg: Constant.ERROR_MSGS.FORGOT_PASSWORD_TOKEN_EXPIRED,
          status: Constant.STATUS_CODE.BAD_REQUEST,
        };
        return Response.error(obj);
      }
      const passHash = bcrypt.hashSync(password, 10);
      await UpdateOne(
        "users",
        {
          "forgotPassword.token": code,
        },
        {
          "email.password": passHash,
          "forgotPassword.token": null,
          "blocked.status": false,
          "blocked.expiry": null,
          updatedTime: new Date(),
        }
      );
      const obj = {
        res,
        msg: Constant.INFO_MSGS.PASSWORD_CHANGED,
        status: Constant.STATUS_CODE.OK,
      };
      return Response.success(obj);
    }
  } catch (error) {
    //console.log("resetPassword Error", error);
    return handleException(logger, res, error);
  }
};

/**
 * Register a new user with Google
 */
const registerWithGoogle = async (req, res) => {
  const { logger } = req;
  try {
    const type = req.query.type;
    const { error } = SignupValidation.google(req.body);
    if (error) {
      const obj = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: error.details[0].message,
      };
      return Response.error(obj);
    }
    const { email, name, picture, email_verified } = req.decoded;
    const { tokenId, accessToken } = req.body;
    const userInfo = await User.findOne({ "email.id": email });
    if (!_.isEmpty(userInfo)) {
      const data = await commonAuth(
        logger,
        userInfo.name,
        userInfo._id,
        req.clientIp,
        type
      );
      await User.findByIdAndUpdate(userInfo._id, {
        lastLogin: new Date(Date.now()),
      });
      const obj = {
        res,
        status: Constant.STATUS_CODE.OK,
        msg: Constant.INFO_MSGS.SUCCESSFUL_LOGIN,
        data,
      };
      return Response.error(obj);
    }

    const { _id } = await User.create({
      name,
      is_active: true,
      email: {
        id: email,
        registrationType: "Google",
        verified: email_verified,
      },
      profilePicture: null,
    });

    const uname = address.slice(2, 7);
    await track.create({ userId: _id });
    await User.findByIdAndUpdate(_id, { userName: uname });

    const payload = {
      name: name,
      homePageLink: `${HOME_PAGE_URL}`,
    };
    await Email.Email(logger, WELCOME_EMAIL_TEMPLATE_ID, email, payload);
    const data = await commonAuth(logger, name, _id, req.clientIp, type);
    const obj = {
      res,
      status: Constant.STATUS_CODE.CREATED,
      msg: Constant.INFO_MSGS.SUCCESSFUL_REGISTER,
      data,
    };
    return Response.success(obj);
  } catch (error) {
    return handleException(logger, res, error);
  }
};

/**
 * Register a new user with Linkedin
 */
const registerWithLinkedin = async (req, res) => {
  const { logger } = req;
  try {
    const type = req.query.type;
    const { email, name, picture, email_verified } = req.decoded;
    const { tokenId, accessToken } = req.body;
    const userInfo = await User.findOne({ "email.id": email });
    if (!_.isEmpty(userInfo)) {
      const data = await commonAuth(
        logger,
        userInfo.name,
        userInfo._id,
        req.clientIp,
        type
      );
      await User.findByIdAndUpdate(userInfo._id, {
        lastLogin: new Date(Date.now()),
      });
      const obj = {
        res,
        status: Constant.STATUS_CODE.OK,
        msg: Constant.INFO_MSGS.SUCCESSFUL_LOGIN,
        data,
      };
      return Response.error(obj);
    }

    const { _id } = await User.create({
      name,
      is_active: true,
      email: {
        id: email,
        registrationType: "Linkedin",
        verified: email_verified,
      },
      profilePicture: null,
    });
    await track.create({ userId: _id });

    const uname = address.slice(2, 7);

    await User.findByIdAndUpdate(_id, { userName: uname });

    const payload = {
      name: name,
      homePageLink: `${HOME_PAGE_URL}`,
    };
    await Email.Email(logger, WELCOME_EMAIL_TEMPLATE_ID, email, payload);
    const data = await commonAuth(logger, name, _id, req.clientIp, type);
    const obj = {
      res,
      status: Constant.STATUS_CODE.CREATED,
      msg: Constant.INFO_MSGS.SUCCESSFUL_REGISTER,
      data,
    };
    return Response.success(obj);
  } catch (error) {
    return handleException(logger, res, error);
  }
};

module.exports = {
  registerWithEmailAndPassword,
  registerWithEmail,
  registerUser,
  registerSPWithEmail,
  commonAuth,
  emailVerify,
  OtpVerify,
  resendEmailVerification,
  forgotPasswordLink,
  resetPassword,
  registerWithGoogle,
  registerWithLinkedin,
  otpReSend,
};
