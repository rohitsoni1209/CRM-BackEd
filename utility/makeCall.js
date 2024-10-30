const axios = require("axios");

const makeCall = (callPayload) => {
  return new Promise(async (resolve, reject) => {
    // //console.log("callPayload---->", callPayload);

    const callLink = "https://kpi.knowlarity.com/Basic/v1/account/call/makecall";

    const payloadData = {
      k_number: "+919513233136",
      agent_number: "+918826824716",
      customer_number: callPayload.customer_number,
      caller_id: "+918035240573",
    };
    // //console.log("callPayload---->", payloadData);


    const headers = {
      "Content-Type": "application/json",
      "x-api-key": "56IGupzqlq8IXft15Dw945bJFMyH1KVx9UhIToz3",
      Authorization: "f27dd538-8ce3-4ccd-b164-ca7237d824c5",
      Accept: "application/json",
    };


    axios
      .post(callLink, payloadData, { headers })
      .then((response) => {
        // //console.log("result", response.data);
        resolve(response);
      })
      .catch((error) => {
        // //console.log("error-After-Post->",error)
        // //console.log("error-message->",error.message)
        reject(error.message);
      });
  });
};

module.exports = {
  makeCall,
};
