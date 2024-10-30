const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const _ = require("underscore");
var qs = require("qs");
const axios = require("axios");
const Response = require("./response");
const Constant = require("./constant");
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
const { access_token } = require("../controller/platforms/facebookController");
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
  const respSql = await FindOne("platforms_credentials", { name: "facebook" });
  return respSql;
};

const AccessTokenByCode = async (code) => {
  var credential = await credentials();
  var url =
    "https://graph.facebook.com/v17.0/oauth/access_token?client_id=" +
    credential.client_id +
    "&client_secret=" +
    credential.client_secret +
    "&redirect_uri=" +
    credential.redirect_uri +
    "&code=" +
    code;
  var data = {};
  try {
    const response = await axios.get(`${url}`, data, getBasicHeaders());
    return response.data.access_token;
  } catch (err) {
    //console.log(err);
    return null;
  }
};

const buessiness_account_ids = async (access_token) => {
  var url =
    "https://graph.facebook.com/v17.0/me/adaccounts?&access_token=" +
    access_token;

  var data = {};
  try {
    const response = await axios.get(`${url}`, data, getBasicHeaders());

    return response.data;
  } catch (err) {
    //console.log(err);
    return null;
  }
};

const get_ads_data = async (accountid, access_token) => {
  var url =
    "https://graph.facebook.com/v17.0/act_" +
    accountid +
    "/ads?access_token=" +
    access_token +
    "&fields=name,account_id,effective_status,updated_time,insights{reach,impressions,cpm,unique_clicks,spend}&limit=100";
  var data = {};
  //console.log(url);
  try {
    const response = await axios.get(`${url}`, data, getBasicHeaders());

    return response.data;
  } catch (err) {
    //console.log(err);
    return null;
  }
};

const get_ads_data_specific = async (adset_id, access_token) => {
  var url =
    "https://graph.facebook.com/v17.0/" +
    adset_id +
    "?access_token=" +
    access_token +
    "&fields=name,ads,account_id,effective_status,updated_time,insights{reach,impressions,cpm,unique_clicks,spend}";

  var data = {};

  try {
    const response = await axios.get(`${url}`, data, getBasicHeaders());

    return response.data;
  } catch (err) {
    //console.log(err);
    return null;
  }
};

const get_ads_creadtive__data = async (accountid, access_token) => {
  var url =
    "https://graph.facebook.com/v17.0/act_" +
    accountid +
    "/adcreatives/?fields=url,name,path,image_url,thumbnail_url,creative&access_token=" +
    access_token;
  var data = {};
  try {
    const response = await axios.get(`${url}`, data, getBasicHeaders());

    return response.data;
  } catch (err) {
    //console.log(err);
    return null;
  }
};

const get_adsets_data = async (accountid, access_token) => {
  var url =
    "https://graph.facebook.com/v17.0/act_" +
    accountid +
    "/adsets?fields=name,ads,account_id,billing_event,budget_remaining,daily_budget,campaign_attribution,effective_status,end_time,optimization_goal,start_time,updated_time,insights{reach,impressions,cpm,unique_clicks,spend}&limit=100&access_token=" +
    access_token;
  //console.log(url);
  var data = {};
  try {
    const response = await axios.get(`${url}`, data, getBasicHeaders());

    return response.data;
  } catch (err) {
    //console.log(err);
    return null;
  }
};

const get_ad_images = async (accountid, access_token) => {
  var url =
    "https://graph.facebook.com/v17.0/act_" +
    accountid +
    "/adimages?fields=name%2Cpermalink_url%2Curl&access_token=" +
    access_token;

  var data = {};
  try {
    const response = await axios.get(`${url}`, data, getBasicHeaders());

    return response;
  } catch (err) {
    //console.log(err);
    return null;
  }
};

// const get_ad_insights =async(ad_id,access_token)=>{

//   var url= "https://graph.facebook.com/v17.0/"+ad_id+"/insights/?fields=account_currency,account_id,account_name,ad_name,adset_id,adset_name,campaign_id,campaign_name,clicks,conversion_rate_ranking,conversions,ctr,full_view_reach,full_view_impressions,impressions,reach,spend,unique_clicks,website_ctr,conversion_values&access_token="+access_token;
//   //console.log(url)
//   //console.log("PPPPPPPPPPPPPPPPPPPPPPPPPPPP")
//   var data={};
//     try {
//       const response = await axios.get(`${url}`, data, getBasicHeaders());

//       return response.data;
//     } catch (err) {
//       //console.log(err);
//       return null;
// }
// }

const get_campaigns_data = async (accountid, access_token) => {
  var url =
    "https://graph.facebook.com/v17.0/act_" +
    accountid +
    "/campaigns?fields=name,adsets,account_id,billing_event,budget_remaining,daily_budget,campaign_attribution,effective_status,end_time,optimization_goal,start_time,updated_time,insights{reach,impressions,cpm,unique_clicks,spend}&limit=100&access_token=" +
    access_token;
  //console.log(url);
  var data = {};
  try {
    const response = await axios.get(`${url}`, data, getBasicHeaders());

    return response.data;
  } catch (err) {
    //console.log(err);
    return null;
  }
};

const get_leads_data = async (ads_id, access_token) => {
  var url =
    "https://graph.facebook.com/v17.0/" +
    ads_id +
    "/leads?access_token=" +
    access_token;

  //console.log(url);
  var data = {};
  try {
    const response = await axios.get(`${url}`, data, getBasicHeaders());

    return response.data;
  } catch (err) {
    //console.log(err);
    return null;
  }
};

module.exports = {
  credentials,
  AccessTokenByCode,
  buessiness_account_ids,
  get_ads_data,
  get_ads_creadtive__data,
  get_adsets_data,
  get_ad_images,
  get_campaigns_data,
  get_leads_data,
  get_ads_data_specific,
  // get_ad_insights
};
