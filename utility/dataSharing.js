const { ObjectId } = require("mongodb");
const _ = require("underscore");
const {
    Find,
    Insert,
    InsertOne,
    Aggregation,
    UpdateOne,
    FindOne,
    Count,
    Delete,
} = require("../library/methods");

const dataSharing = (req, moduleTitle, OwnerField, mass) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { organizationId, userId } = req.decoded;
            const dataSharing = await FindOne('permission', { organizationId: new ObjectId(organizationId), moduleTitle });
            //console.log('dataSharing', dataSharing)
            if (dataSharing != null) {
                if (dataSharing.Private) {
                    matchCondition[OwnerField] = new ObjectId(userId);
                }
                //console.log('mass',mass)
                if (mass) {
                    if (!dataSharing.delete) {
                        matchCondition[OwnerField] = new ObjectId(userId);
                    }
                }
            } else {
                matchCondition[OwnerField] = new ObjectId(userId);
            }
            //console.log('matchCondition111',matchCondition)
            resolve(matchCondition);
        } catch (error) {
            //console.log('Error in Download Data:', error)
            reject(error);
        }
    });
};

module.exports = {
    dataSharing,
};
