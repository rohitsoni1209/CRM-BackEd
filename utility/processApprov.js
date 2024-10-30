const { ObjectId } = require("mongodb");
const mongodb = require("mongodb");
const _ = require("underscore");

const { DeleteMany, FindOne, InsertOne } = require("../library/methods");

// ACTION EMAIL SEND
async function handleSendEmailAction(emailTemplate, organizationId) {
  var emailObj = {};
  emailTemplate.To.map(async (id) => {
    const userInfo = await FindOne("users", { _id: new ObjectId(id) });
    // //console.log("_id",userInfo._id)
    emailObj["EmailsOwnerId"] = new ObjectId(userInfo._id);
    emailObj["organizationId"] = new ObjectId(organizationId);
    emailObj["templateId"] = new ObjectId(emailTemplate.TemplateId);
    emailObj["createdTime"] = new Date();
    emailObj["updatedTime"] = new Date();

    //console.log("sendEmail-->", emailObj);
    await InsertOne("sendEmail", emailObj);
  });
  return;
}


// ACTION TASK ASSIGN
async function handleTaskAction(assignTask, organizationId) {
  assignTask["TasksOwnerId"] = new ObjectId(assignTask.TasksOwnerId);
  assignTask["organizationId"] = new ObjectId(organizationId);
  assignTask["DueDate"] = new Date(assignTask.DueDate);
  assignTask["createdTime"] = new Date();
  assignTask["updatedTime"] = new Date();

  //console.log("Task-->", assignTask);
  await InsertOne("tasks", assignTask);
}


// ACTION FIELD UPDATE
function handleFieldUpdateAction(updateField, BodyData) {
  for (const key in BodyData) {
    if (key.match(updateField.field)) {
      BodyData[updateField.field] = updateField.data;
      // //console.log("BodyData", BodyData);
    }
  }
}


const ProcessApprove = (logger, payload) => {
  return new Promise(async (resolve, reject) => {
    try {
      //   //console.log("payload", payload);
      var { collection, id, userId, BodyData, reqMethod, organizationId } =
        payload;

      const LeadData = await FindOne(collection, { _id: new ObjectId(id) });
      // //console.log("LeadData>>>>",LeadData)
      if (LeadData?.ApprovalStatus == 'reject' || 'approve') {
        // //console.log('existtatus')
        resolve()
        return;
      }
      const ApprovalProcessData = await FindOne("approvalprocess", {
        _id: new ObjectId(LeadData.ApprovalProcessId),
      });
      //console.log("ApprovalProcessData", ApprovalProcessData);
      var { WhoApprove, RejectionAction, ApprovalAction, when } =
        ApprovalProcessData;
      var { FinalStage, EachStage } = ApprovalAction;

      var matchArr = [];
      if (LeadData?.Approver.length > 0) {
        LeadData?.Approver.map((Approver) => {
          matchArr.push(Approver.value == userId);
        });
      }
      // if (matchArr.includes(false) && BodyData.ApprovalStatus == 'approve') {
      //   const obj = {
      //     Authorized : false
      //   };
      //   resolve(obj);
      //   return;
      // }
      // //console.log("matchArr--->", matchArr);
      if (matchArr.includes(false) && BodyData?.ApprovalStatus == "approve") {
        resolve();
        return;
      }

      if (BodyData?.ApprovalStatus == "approve") {
        EachStage.ActionName.includes("updatefield");
        for (const key in BodyData) {
          if (key.match(EachStage.field)) {
            BodyData[EachStage.field] = EachStage.data;
            // //console.log("BodyData", BodyData);
          }
        }
        var { emailTemplate, assignTask } = FinalStage;
        for (const key in FinalStage) {
          if (key == "emailTemplate") {
            await handleSendEmailAction(emailTemplate, organizationId);
          } else if (key == "assignTask") {
            await handleTaskAction(assignTask, organizationId);
          }
        }
      }
      if (BodyData?.ApprovalStatus == "reject") {
        var { emailTemplate, updateField } = RejectionAction;
        //console.log("emailTemplate", emailTemplate);
        for (const key in RejectionAction) {
          if (key == "emailTemplate") {
            await handleSendEmailAction(emailTemplate, organizationId);
          } else if (key == "updateField") {
            handleFieldUpdateAction(updateField, BodyData);
          }
        }
      }

      resolve();
    } catch (error) {
      // //console.log("Error in ProcessApprove", error);
      logger.error(`Error in ProcessApprove ${error}`);
      reject(error);
    }
  });
};

module.exports = {
  ProcessApprove,
};
