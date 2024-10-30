const { ObjectId } = require('mongodb');
const mongodb = require('mongodb');
const _ = require('underscore');
const { DeleteMany } = require("../library/methods");



const massDeleteAll = (logger, payload) => {
    return new Promise(async (resolve, reject) => {
        try {
            //console.log('payload',payload);
            await DeleteMany("accounts", { connectionId: { $in: payload } });
            await DeleteMany("calls", { connectionId: { $in: payload } });
            await DeleteMany("contacts", { connectionId: { $in: payload } });
            await DeleteMany("deals", { connectionId: { $in: payload } });
            await DeleteMany("invoices", { connectionId: { $in: payload } });
            await DeleteMany("leads", { connectionId: { $in: payload } });
            await DeleteMany("meetings", { connectionId: { $in: payload } });
            await DeleteMany("purchaseOrders", { connectionId: { $in: payload } });
            await DeleteMany("quotes", { connectionId: { $in: payload } });
            await DeleteMany("saleOrders", { connectionId: { $in: payload } });
            await DeleteMany("sitevisits", { connectionId: { $in: payload } });
            await DeleteMany("tasks", { connectionId: { $in: payload } });
            await DeleteMany("inventory", { connectionId: { $in: payload } });
            await DeleteMany("note", { connectionId: { $in: payload } });
            await DeleteMany("vendor", { connectionId: { $in: payload } });
            await DeleteMany("workflow", { connectionId: { $in: payload } });
            resolve();
        } catch (error) {
            logger.error(`Error in sending email ${error}`);
            reject(error);
        }
    });
};



module.exports = {
    massDeleteAll,
};




