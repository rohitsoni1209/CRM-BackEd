const jwt = require("jsonwebtoken");
const _ = require("underscore");
const Response = require("../helpers/response");
const Constant = require("../helpers/constant");
const { handleException } = require("../helpers/exception");
const {
  Find,
  UpdateOne,
  Insert,
  FindOne,
  InsertOne,
} = require("../library/methods");
const ObjectId = require("mongodb").ObjectId;
const { JWT_SECRET } = process.env;

/**
 * Verify JWT Token
 *
 * @param {object} jwt (json web token)
 */
const auth = async (req, res, next) => {
  const { logger } = req;
  try {
    let token =
      req.body.token || req.query.token || req.headers["x-auth-token"];

    if (
      _.isUndefined(token) ||
      _.isEmpty(token) ||
      token.length == 0 ||
      token.toString() === "null"
    ) {
      const obj = {
        res,
        status: Constant.STATUS_CODE.UN_AUTHORIZED,
        msg: Constant.ERROR_MSGS.TOKEN_MISSING,
      };
      return Response.error(obj);
    }

    if (!token.startsWith("bearer ")) {
      const obj = {
        res,
        status: Constant.STATUS_CODE.UN_AUTHORIZED,
        msg: Constant.ERROR_MSGS.INVALID_TOKEN_FORMAT,
      };
      return Response.error(obj);
    }

    // Remove Bearer from string
    token = token.slice(7, token.length).trimLeft();
    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) {
        //console.log("token vrify error:  ", err);
        const obj = {
          res,
          status: Constant.STATUS_CODE.UN_AUTHORIZED,
          msg: Constant.ERROR_MSGS.TOKEN_SESSION_EXPIRED,
        };
        return Response.error(obj);
      }

      const userData = await FindOne("users", {
        _id: new ObjectId(decoded.userId),
      });
      if (userData && userData.email && userData.email.id) {
        decoded.email = userData.email.id;
        decoded.name = userData.name;
        decoded.organizationId = userData.organizationId;
      }
      if (req.url === "/token" && decoded.type === "Refresh") {
        req.decoded = decoded;
        const { status, msg } = await jwtDBChecker(
          decoded,
          "refresh",
          req.clientIp
        );

        if (msg == null) {
          next();
        } else {
          const obj = {
            res,
            status: status,
            msg: msg,
          };
          return Response.error(obj);
        }
      } else if (decoded.type === "Access" && req.url !== "/token") {
        req.decoded = decoded;

        await auditLog(req, res);

        const { status, msg } = await jwtDBChecker(
          decoded,
          "access",
          req.clientIp
        );
        if (msg == null) {
          // console.log("next", decoded);
          next();
        } else {
          const obj = {
            res,
            status: status,
            msg: msg,
          };
          return Response.error(obj);
        }
      } else {
        const obj = {
          res,
          status: Constant.STATUS_CODE.UN_AUTHORIZED,
          msg: Constant.ERROR_MSGS.INVALID_TOKEN_TYPE,
        };
        return Response.error(obj);
      }
    });
  } catch (error) {
    //console.log("auth error", error);
    return handleException(logger, res, error);
  }
};

/**
 * Checks JTI in DB
 */
const jwtDBChecker = async (decoded, type, ip) => {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await FindOne("users", {
        _id: new ObjectId(decoded.userId),
      });
      if (!user) {
        return resolve({
          status: Constant.STATUS_CODE.UN_AUTHORIZED,
          msg: Constant.ERROR_MSGS.TOKEN_SESSION_EXPIRED,
        });
      } else if (user.jti[type] === decoded.jti) {
        return resolve({
          status: Constant.STATUS_CODE.OK,
          msg: null,
        });
      } else {
        await UpdateOne(
          "users",
          { _id: decoded.userId },
          {
            jti: {
              access: null,
              refresh: null,
              ip: null,
            },
            updatedTime: new Date(),
          }
        );

        return resolve({
          status: Constant.STATUS_CODE.UN_AUTHORIZED,
          msg: Constant.ERROR_MSGS.TOKEN_SESSION_EXPIRED,
        });
      }
    } catch (error) {
      return reject(error);
    }
  });
};

/**
 * Checks JTI in DB
 */
const auditLog = async (req, res) => {
  return new Promise(async (resolve, reject) => {
    try {
      const userAgent = req.headers["user-agent"];
      const clientIp =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;
      const { userId, organizationId } = req.decoded;

      let clientIpAddress = null;
      // //console.log('clientIp',clientIp);
      if (clientIp && clientIp?.startsWith("::ffff:")) {
        clientIpAddress = clientIp.slice(7);
      }
      // //console.log(req)
      let collectionName = req.baseUrl.replace("/v1/", "");
      // //console.log(req.originalUrl)
      if (req.originalUrl != "/v1") {
        let actionData = null;
        if (req.method == "POST") {
          actionData = "Add";
        } else if (req.method == "GET") {
          actionData = "View";
        } else if (req.method == "PATCH") {
          actionData = "Update";
        } else if (req.method == "DELETE") {
          actionData = "Delete";
        } else {
          actionData = "Unknown";
        }

        let payload = {
          action: actionData,
          userBrowser: userAgent,
          collectionName: req.originalUrl,
          method: req.method,
          body: req.body,
          clientIp: clientIpAddress,
          userId: new ObjectId(userId),
          organizationId: new ObjectId(organizationId),
          createdTime: new Date(),
          updatedTime: new Date(),
        };
        await InsertOne("auditLog", payload);
      }
      return resolve({
        msg: Constant.INFO_MSGS.SUCCESS,
        status: Constant.STATUS_CODE.OK,
      });
    } catch (error) {
      return reject(error);
    }
  });
};

module.exports = { auth };
