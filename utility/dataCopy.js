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

const dataCopy = (collectionName, connectionId, newConnectionId) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Get the document you want to copy
            const docToCopy = await FindOne(collectionName, { connectionId: new ObjectId(connectionId) });
            //console.log('docToCopy', docToCopy)
            if (docToCopy) {
                const datacheck = await FindOne(collectionName, { connectionId: new ObjectId(newConnectionId) });
                //console.log('datacheck', datacheck)
                if (!datacheck) {
                    // Create a new document with the same structure as the original
                    let newDoc = Object.assign({}, docToCopy);

                    // Remove the _id field from the new document
                    delete newDoc._id;

                    // Add new fields to the new document
                    // newDoc.newField1 = "value1";
                    newDoc.connectionId = new ObjectId(newConnectionId);

                    // Generate a new ObjectId for the _id field
                    newDoc._id = new ObjectId();

                    // Insert the new document into the collection
                    await InsertOne(collectionName, newDoc);
                }
            }
            resolve();
        } catch (error) {
            //console.log('Error in Download Data:', error)
            reject(error);
        }
    });
};

module.exports = {
    dataCopy,
};
