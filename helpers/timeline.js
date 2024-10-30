const bcrypt = require("bcrypt");
const { handleException } = require("../helpers/exception");
const Response = require("../helpers/response");
const Constant = require("../helpers/constant");
const ProfileValidation = require("../helpers/joi-validation");
const { ObjectId } = require("mongodb");
const mongodb = require("mongodb");
const _ = require("underscore");
const {
  Find,
  Insert,
  InsertOne,
  Aggregation,
  UpdateOne,
  FindOne,
  Count,
} = require("../library/methods");
const moment = require("moment");

const insertTimeLine = (logger, connectionId, data) => {
  return new Promise(async (resolve, reject) => {
    let module = data?.data?.parentModule?.toLowerCase();
    //console.log('data', module)
    let payload = {
      connectionId: new ObjectId(connectionId),
      data,
      createdTime: new Date(),
      updatedTime: new Date(),
    };
    await InsertOne("timeline", payload);


    //console.log('module', module)
    await UpdateOne(module,
      { _id: new ObjectId(connectionId) },
      { lastActivityTime: new Date() }
    );

    resolve();
  });
};

module.exports = {
  insertTimeLine,
};
