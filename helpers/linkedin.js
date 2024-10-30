const _ = require('underscore');
const axios = require('axios');
const Response = require('../helpers/response');
const Constant = require('../helpers/constant');

const {
    LINKEDIN_REDIRECT_URL,
    LINKEDIN_CLIENT_ID,
    LINKEDIN_CLIENT_SECRET,
  } = process.env;


const linkedinVerify = async (req, res, next) => {
    // get the token from frontend
    const {token} = req.body

    // get an access token from linkedin API
    const result = await axios
        .post("https://www.linkedin.com/oauth/v2/accessToken", querystring.stringify({
            grant_type: "authorization_code",
            code: token,
            redirect_uri: LINKEDIN_REDIRECT_URL,
            client_id: LINKEDIN_CLIENT_ID,
            client_secret: LINKEDIN_CLIENT_SECRET
        }));
    const accessToken = result.data.access_token;

    // get the user's email address
    const emailRequest = await axios
        .get('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))&oauth2_access_token=' + accessToken);
    const email = emailRequest.data.elements[0]['handle~'].emailAddress;
    
    if(email){
        next();
    }else{
        const obj = {
            res,
            status: Constant.STATUS_CODE.BAD_REQUEST,
            msg: Constant.ERROR_MSGS.LINKEDIN_AUTHENTICATION_FAILED,
          };
        return Response.error(obj);
    }
    
}

module.exports = { linkedinVerify };
