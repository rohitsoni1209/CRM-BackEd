const cron = require("node-cron");
const { promisify } = require("util");
const { Find, Aggregation, InsertOne } = require("../../library/methods");
const { async } = require("crypto-random-string");
const { ObjectId } = require("mongodb");
const _ = require("underscore");

const {
  returnFilterByFieldQuery,
  returnFilterButton,
} = require("../../utility/filter");

module.exports = async (logger) => {
  try {
    const myAsyncJob = async () => {
      const escalationData = await Find("caseescalation", { Active: true });

      for (let j = 0; j < escalationData?.length; j++) {
        const Rules = escalationData[j]?.Rule;
        if (Rules?.length >= 0) {
          for (let i = 0; i < Rules?.length; i++) {
            if (Rules[i]) {
              var { Actions, Details, Criteria } = Rules[i];
              if (Criteria) {
                var { CriteriaPattern, filterArray } = Criteria;
              }
              if (Actions) {
                var {
                  NotifyAssignee,
                  EscalatedOwner,
                  EscalationTemplate,
                  EscalateTo,
                  Time_Hour,
                } = Actions;
              }
            }
            var matchCondition = {};

            //   //console.log("filterArray-->", filterArray);
            if (filterArray?.length > 0) {
              matchCondition = await returnFilterByFieldQuery(
                logger,
                filterArray
              );
            }

            //   //console.log("matchCondition-->", matchCondition);

            let aggregationQuery = [
              {
                $match: matchCondition,
              },
            ];

            const LeadsData = await Aggregation("leads", aggregationQuery);
            //   //console.log("LeadsData--->", LeadsData);

            for (let obj of LeadsData) {
              for (let key in obj) {
                if (key == Details) {
                  var DataTime = obj[key];
                  const timeValue = parseInt(Time_Hour);
                  const timeToAdd = timeValue * 60 * 60 * 1000;

                  const updatedDateTime = new Date(
                    DataTime.getTime() + timeToAdd
                  );
                  // //console.log("updatedDateTime-->",updatedDateTime)
                  // const curruntTime = "2023-07-21T11:11:17.630Z";
                  // const updatedDateTime2 = "2023-07-21T11:11:16.630Z";
                  if (new Date() == updatedDateTime) {
                    // if (curruntTime > updatedDateTime2) {
                    //   //console.log("Matched !!");
                    if (EscalateTo) {
                      const emailObj = {};
                      emailObj["EmailsOwnerId"] = new ObjectId(EscalateTo);
                      emailObj["organizationId"] = new ObjectId(
                        obj.organizationId
                      );
                      emailObj["templateId"] = new ObjectId(EscalationTemplate);
                      emailObj["createdTime"] = new Date();
                      emailObj["updatedTime"] = new Date();

                      // Create sendSms
                      await InsertOne("sendEmail", emailObj);
                    }
                    if (EscalatedOwner) {
                      const emailObj = {};
                      emailObj["EmailsOwnerId"] = new ObjectId(EscalatedOwner);
                      emailObj["organizationId"] = new ObjectId(
                        obj.organizationId
                      );
                      emailObj["templateId"] = new ObjectId(NotifyAssignee);
                      emailObj["createdTime"] = new Date();
                      emailObj["updatedTime"] = new Date();

                      // Create sendSms
                      await InsertOne("sendEmail", emailObj);
                    }
                  }
                  // //console.log("NotMatch");
                }
              }
            }
          }
        }
      }
    };

    const promisifiedJob = promisify(myAsyncJob);

    // Run every 3 second
    cron.schedule("* * * * * *", async () => {
      //   //console.log("Cron Start");
      await promisifiedJob();
    });
  } catch (error) {
    //console.log("error-cron", error);
    logger.error(`Error in AutoResponder CronJob --> ${error}`);
  }
};
