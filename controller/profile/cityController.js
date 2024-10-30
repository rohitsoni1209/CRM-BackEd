const { handleException } = require('../../helpers/exception');
const Response = require('../../helpers/response');
const Constant = require('../../helpers/constant');
// const city = require("../../models/city");
const { Find, Insert } = require("../../library/methods");
const getAllcity = async (req, res) => {
    const { logger } = req;
    try {
        let getCityData = await Find('city');

        if (getCityData.length > 0) {
            const obj = {
                res,
                msg: Constant.INFO_MSGS.SUCCESS,
                status: Constant.STATUS_CODE.OK,
                data: getCityData,
            };
            return Response.success(obj);
        } else {
            const obj = {
                res,
                status: Constant.STATUS_CODE.BAD_REQUEST,
                msg: Constant.INFO_MSGS.NO_DATA,
            };
            return Response.error(obj);
        }
    } catch (error) {
        //console.log('error', error)
        return handleException(logger, res, error);
    }
};


module.exports = {
    getAllcity,
}