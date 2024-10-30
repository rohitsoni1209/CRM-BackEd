const axios = require("axios");
var needle = require("needle");
const _ = require("underscore");
const moment = require("moment");

const {
  SMS_API_KEY,
  SMS_SENDER_ID,
} = process.env;


const sendMsg = (payload) => {
  return new Promise(async (resolve, reject) => {
    // //console.log('Hello')
    let link = `https://smsapi.24x7sms.com/api_2.0/SendSMS.aspx?APIKEY=${SMS_API_KEY}&MobileNo=${payload.mobile}&SenderID=${SMS_SENDER_ID}&Message=${payload.message}&ServiceName=TEMPLATE_BASED&DLTTemplateID=${payload.template_id}`
    // //console.log('link',link)
    needle.get(
      link,
      ((err, result) => {
        if (result) {
          // //console.log('result',result)
          resolve(result);
        } else {
          //console.log('err',err)
          reject(err.message);
        }
      })
    );
  });
};

module.exports = {
  sendMsg,
};
