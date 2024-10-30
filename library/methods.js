const db = require("./mongodb");

const FindAll = async (
  tableName,
  condition = {},
  skip = 0,
  // limit = 10,
  sort = null
) => {
  try {
    sort = !sort ? {} : sort;
    return await (await db())
      .collection(tableName)
      .find(condition)
      .sort(sort)
      .skip(skip)
      // .limit(limit)
      .toArray();
  } catch (error) {
    console.error("Error fetching data In Find", error);
  }
};

const Find = async (
  tableName,
  condition = {},
  skip = 0,
  limit = 10,
  sort = null
) => {
  try {
    sort = !sort ? {} : sort;
    return await (await db())
      .collection(tableName)
      .find(condition)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();
  } catch (error) {
    console.error("Error fetching data In Find", error);
  }
};
const Count = async (tableName, condition = {}) => {
  try {
    return await (await db()).collection(tableName).count(condition);
  } catch (error) {
    console.error("Error fetching data In Find", error);
  }
};

const Insert = async (tableName, data) => {
  try {
    return await (await db()).collection(tableName).insertMany(data);
  } catch (error) {
    console.error("Error inserting data", error);
  }
};

const InsertOne = async (tableName, data) => {
  if (tableName) {
    try {
      return await (await db()).collection(tableName).insertOne(data);
    } catch (error) {
      console.error("Error inserting data===>", error);
    }
  } else {
    console.error("Error inserting data===>", tableName, data);

  }

};

const UpdateOne = async (tableName, conditon, data) => {
  try {
    return await (await db())
      .collection(tableName)
      .updateOne(conditon, { $set: data });
  } catch (error) {
    //console.log('UpdateOne', error)
    console.error("Error fetching data In Update One");
  }
};
const UpdateMany = async (tableName, conditon, data) => {
  try {
    return await (await db())
      .collection(tableName)
      .updateMany(conditon, { $set: data });
  } catch (error) {
    //console.log('updateMany', error)
    console.error("Error fetching data In Update One");
  }
};

const Delete = async (tableName, condition) => {
  try {
    return await (await db())
      .collection(tableName)
      .updateOne(condition, {
        $set: { status: 0, deletedAt: new Date().getTime() },
      });
  } catch (error) {
    console.error("Error fetching data Delete");
  }
};

const FindOne = async (tableName, condition = {}) => {
  try {
    return await (await db()).collection(tableName).findOne(condition);
  } catch (error) {
    console.error("Error fetching data FindOne");
  }
};
const FindOne1 = (tableName, condition = {}) => {
  try {
    return db().collection(tableName).findOne(condition);
  } catch (error) {
    console.error("Error fetching data FindOne");
  }
};
const TotalCount = async (tableName, condition = {}) => {
  try {
    return await (await db()).collection(tableName).countDocuments(condition);
  } catch (error) {
    console.error("Error fetching data");
  }
};

const Aggregation = async (tableName, condition = [{}]) => {
  try {
    return await (await db())
      .collection(tableName)
      .aggregate(condition)
      .toArray();
  } catch (error) {
    console.error("Error fetching data Aggregation", error);
  }
};

const PermanentDelete = async (tableName, condition) => {
  try {
    return await (await db()).collection(tableName).deleteOne(condition);
  } catch (error) {
    console.error("Error fetching data");
  }
};

const DeleteMany = async (tableName, condition) => {
  try {
    return await (await db()).collection(tableName).deleteMany(condition);
  } catch (error) {
    console.error("Error fetching data");
  }
};

module.exports = {
  FindAll,
  Find,
  Insert,
  UpdateOne,
  Delete,
  FindOne,
  FindOne1,
  TotalCount,
  Aggregation,
  PermanentDelete,
  InsertOne,
  Count,
  UpdateMany,
  DeleteMany,
};
