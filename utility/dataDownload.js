const { MongoClient } = require('mongodb');

const downloadData = (logger, organizationId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const client = new MongoClient(`${process.env.MONGO_URI}`, { useUnifiedTopology: true });
            const clientConnection = await client.connect();
            const db = clientConnection.db();

            const collections = await db.listCollections().toArray();

            const allData = {};

            for (const collection of collections) {
                // //console.log("Collection-->Name->",collection.name)
                const collectionName = collection.name;
                const collectionData = await db.collection(collectionName).find({ organizationId }).toArray();
                allData[collectionName] = collectionData;
            }
            resolve(allData);
        } catch (error) {
            logger.error(`Error in Download Data: ${error}`);
            reject(error);
        }
    });
};



module.exports = {
    downloadData,
};




