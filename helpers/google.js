const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const _ = require('underscore');
var qs = require("qs");
const axios = require('axios');
const Response = require('../helpers/response');
const Constant = require('../helpers/constant');
const {
  Find,
  Insert,
  InsertOne,
  Aggregation,
  UpdateOne,
  FindOne,
  Count,
  UpdateMany,
} = require("../library/methods");
// var imageAsBase64 = fs.readFileSync("./your-image.png", "base64");

const getBasicHeaders = () => {
  return {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };
};

// const getHeaders = (token) => {
//   return {
//     headers: {
//       authorization: "Bearer " + token,
//       "Content-Type": "application/json",
//     },
//   };
// };

const credentials = async () => {
  const respSql = await FindOne("platforms_credentials", { "name": 'google' });
  return respSql;
};

// HTTP GET Request - Returns Resolved or Rejected Promise
const AccessTokenByCode = async (code) => {
  var url = "https://oauth2.googleapis.com/token";
  var credential = await credentials();

  var data = qs.stringify({
    grant_type: "authorization_code",
    client_id: credential.client_id,
    client_secret: credential.client_secret,
    redirect_uri: credential.redirect_uri,
    code: code,
  });

  try {
    const response = await axios.post(`${url}`, data, getBasicHeaders());

    return response.data.access_token;
  } catch (err) {
    //console.log(err);
    return null;
  }
};


module.exports = {
  credentials,
  AccessTokenByCode,

};
