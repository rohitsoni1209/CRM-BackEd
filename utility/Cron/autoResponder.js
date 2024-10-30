const cron = require("node-cron");
const { promisify } = require("util");
const { Find, Aggregation, InsertOne } = require("../../library/methods");
const { async } = require("crypto-random-string");
const { ObjectId } = require("mongodb");

const {
  returnFilterByFieldQuery,
  returnFilterButton,
} = require("../../utility/filter");

module.exports = async (logger) => {
  try {
    const myAsyncJob = async () => {
      let respondersData = await Find("autoresponder");
      if (respondersData) {
        // //console.log("respondersData.length---->", respondersData.length);
        for (let i = 0; i < respondersData.length; i++) {
          // Plus 5 minutes to the Currunt Time
          const fiveMinutesPlus = new Date(new Date().getTime() + 5 * 60000);
          // //console.log("dataTime",new Date())
          // //console.log("fiveMinutesPlus",fiveMinutesPlus)
          // const fiveMinutesPlus = new Date("2023-07-03T00:00:00.000+00:00");

          var filteredData = await Find("autoresponder", {
            FollowUpDate: new Date(fiveMinutesPlus),
          });
          // //console.log("filteredData-->",filteredData)
          // //console.log(" filteredData.length---->", filteredData.length);

          for (let j = 0; j < filteredData.length; j++) {
            const ModuleName = filteredData[j].Module;
            const TemplateId = filteredData[j].TemplateId;
            const filterbutton = filteredData[j].CustomView;
            const userId = filteredData[j].AutorespondersOwnerId;
            var matchCondition = {};
            if (filterbutton != "All") {
              matchCondition = await returnFilterButton(
                logger,
                filterbutton,
                userId
              );
            }
            let aggregationQuery = [
              {
                $match: matchCondition,
              },
            ];

            const workFlowData = await Aggregation(
              ModuleName,
              aggregationQuery
            );
            // //console.log("workFlowData.length---->", workFlowData.length);
            // //console.log("workFlowData---->", workFlowData);


            for (let k = 0; k < workFlowData.length; k++) {
              const workFlowDataObj = workFlowData[k];
              for (let key in workFlowDataObj) {
                if (key.includes("OwnerId")) {
                  var ownerKey = workFlowDataObj[key];
                  var organizationId = workFlowDataObj["organizationId"];
                }
              }
              const emailObj = {};
              emailObj["EmailsOwnerId"] = new ObjectId(ownerKey);
              emailObj["organizationId"] = new ObjectId(organizationId);
              emailObj["templateId"] = new ObjectId(TemplateId);
              emailObj["createdTime"] = new Date();
              emailObj["updatedTime"] = new Date();
              // //console.log("emailObj--->", emailObj);

              // Create sendEmail
              await InsertOne("sendEmail", emailObj);
            }
          }
        }
      }
    };

    const promisifiedJob = promisify(myAsyncJob);

    // Run every 3 second
    cron.schedule("* * * * * *", async () => {
      // //console.log("Cron Start");
      await promisifiedJob();
    });
  } catch (error) {
    //console.log("error-cron", error);
    logger.error(`Error in AutoResponder CronJob --> ${error}`);
  }
};
