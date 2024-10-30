var qs = require("qs");
const axios = require("axios");
const Response = require("../../helpers/response");
const Constant = require("../../helpers/constant");
const { handleException } = require("../../helpers/exception");

const {
  Find,
  UpdateOne,
  Insert,
  FindOne,
  InsertOne,
} = require("../../library/methods");
const ObjectId = require("mongodb").ObjectId;

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
module.exports = {
  GetAuthURL,
};
