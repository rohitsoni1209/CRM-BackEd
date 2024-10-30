const { handleException } = require("../helpers/exception");
const Response = require("../helpers/response");
const Constant = require("../helpers/constant");
const { ObjectId } = require("mongodb");
const _ = require("underscore");

const {
  returnFilterByFieldQuery,
  returnFilterButton,
  returnFilterByEquality
} = require("../utility/filter");
const {
  Find,
  Insert,
  InsertOne,
  Aggregation,
  UpdateOne,
  FindOne,
  Count,
  UpdateMany,
  PermanentDelete,
  DeleteMany,
} = require("../library/methods");

// const InstantActions = async (req, res, next) => {
//   const { logger } = req;

//   try {
//     const { userId, organizationId } = req.decoded;
//     if (_.isUndefined(req.body.ModuleTitle)) {
//       const resp = {
//         res,
//         status: Constant.STATUS_CODE.BAD_REQUEST,
//         msg: "ModuleTitle Is Required !!",
//       };
//       return Response.error(resp);
//     }
//     const obj = {};
//     obj["Method"] = req.method;
//     obj["URL"] = req.url;
//     obj["body"] = req.body;
//     obj["ModuleTitle"] = req.body.ModuleTitle;
//     // //console.log("NodeRequest--->",req)
//     // //console.log("NodeRequest--->", obj);

//     const workFlowData = await Find("workflow", {
//       ModuleTitle: obj.ModuleTitle,
//       organizationId:new ObjectId(organizationId)
//     });
//     if ( _.isEmpty(workFlowData) ) {
//       // //console.log('Empty-workFlowData-array')
//       next();
//     }
//     for(let j=0; j<workFlowData.length; j++){

//     if (_.isNull(workFlowData[j]) || workFlowData[j].status == false ) {
//       //console.log('false')
//       next();
//     } else {
//       // if (workFlowData[j]) {
//       // //console.log("Action-Data-->", workFlowData[j]);
//       const { when, condition, InstantActions: actions } = workflow;

//       const Action = workFlowData[j]?.when?.ExecuteAction;
//       const condition1 = workFlowData[j]?.condition?.certain?.cond1;
//       const condition2 = workFlowData[j]?.condition?.certain?.cond2;
//       var operator = workFlowData[j]?.condition?.certain?.CriteriaPattern;
//       if (operator.includes("or")) {
//         operator = "||";
//       }
//       if (operator.includes("and")) {
//         operator = "&&";
//       }
//       const Actions = workFlowData[j]?.InstantActions;
//       // //console.log("Cond1-->", condition1);
//       // //console.log("Cond2-->", condition2);
//       // const actionCondition = (Action.create == true && Action.edit == true) || Action.edit == true || Action.create == true;
//       // const MethodCondition = obj.Method == "POST" || obj.Method == "PATCH";
//       const MethodConditionAll =
//         (Action.create == true &&
//           Action.edit == true &&
//           (obj.Method == "POST" || obj.Method == "PATCH")) ||
//         (Action.create == true && obj.Method == "POST") ||
//         (Action.edit == true && obj.Method == "PATCH");
//       if (MethodConditionAll && obj.URL.includes("search") == false) {
//         // //console.log("entrypoint");
//         // //console.log('entrypoint-Key',obj.body[`${condition1.key}`])

//         var test1 = obj.body[`${condition1.key}`] == condition1.value;
//         var test2 = obj.body[`${condition2.key}`] == condition2.value;

//         if (eval(`test1 ${operator} test2`)) {
//           // //console.log("ConditionFullfilled !!");
//           for (let i = 0; i < Actions.length; i++) {
//             if (Actions[i].ActionName.toLowerCase().includes("sendemail")) {
//               Actions[i].To.map(async (id) => {
//                 var emailObj = {};
//                 var UserInfo = await FindOne("users", {
//                   _id: new ObjectId(id),
//                 });
//                 emailObj.EmailsOwnerId = new ObjectId(UserInfo?._id);
//                 emailObj.organizationId = new ObjectId(organizationId);
//                 emailObj.templateId = new ObjectId(Actions[i].TemplateId);
//                 emailObj.createdTime = new Date();
//                 emailObj.updatedTime = new Date();
//                 await InsertOne("sendEmail", emailObj);
//                 next();
//               });
//             }
//             if (Actions[i].ActionName.toLowerCase().includes("task")) {
//                 Actions[i].data.TasksOwnerId = new ObjectId(Actions[i].data.TasksOwnerId);
//                 Actions[i].data.organizationId = new ObjectId(organizationId);
//                 Actions[i].data.DueDate = new Date(Actions[i].data.DueDate);
//                 Actions[i].data.createdTime = new Date();
//                 Actions[i].data.updatedTime = new Date();
//                 await InsertOne("task", Actions[i].data);
//                 next();
//             }
//             if (Actions[i].ActionName.toLowerCase().includes("call")) {
//               Actions[i].data.CallsOwnerId = new ObjectId(Actions[i].data.CallsOwnerId);
//               Actions[i].data.CreatedBy = new ObjectId(userId);
//               Actions[i].data.organizationId = new ObjectId(organizationId);
//               Actions[i].data.CallStartTime = new Date(Actions[i].data.CallStartTime);
//               Actions[i].data.createdTime = new Date();
//               Actions[i].data.updatedTime = new Date();
//               await InsertOne("calls", Actions[i].data);
//                 next();
//             }
//             if (Actions[i].ActionName.toLowerCase().includes("meeting")) {
//               Actions[i].data.createdBy = new ObjectId(userId);
//               Actions[i].data.organizationId = new ObjectId(organizationId);
//               Actions[i].data.createdTime = new Date();
//               Actions[i].data.updatedTime = new Date();
//               Actions[i].data.From = new Date(Actions[i].data.From);
//               Actions[i].data.To = new Date(Actions[i].data.To);
//               await InsertOne("meetings", Actions[i].data);
//               next();
//             }
//             if (Actions[i].ActionName.toLowerCase().includes("assignowner")) {
//               //console.log("Actions[i].data.OwnerId--->",Actions[i].data.OwnerId)
//               for (const key in req.body) {
//                 if (key.endsWith("OwnerId")) {
//                   req.body[key] = Actions[i].data.OwnerId
//                 }
//               }
//               next();
//             }
//             if (Actions[i].ActionName.toLowerCase().includes("assignowner")) {
//               //console.log("Actions[i].data.OwnerId--->",Actions[i].data.OwnerId)
//               for (const key in req.body) {
//                 if (key.endsWith("OwnerId")) {
//                   req.body[key] = Actions[i].data.OwnerId
//                 }
//               }
//               next();
//             }
//           }
//         }
//         next();
//       }
//       next();
//       // }
//       // next();
//     }
//   }
//   } catch (error) {
//     //console.log("Action error", error);
//     return handleException(logger, res, error);
//   }
// };




//dk
async function handleSendEmailAction(action, organizationId, ids) {
  var emailObj = {}
  action.data.To.map(async (id) => {
    const userInfo = await FindOne("users", { _id: new ObjectId(id) });
    // //console.log("_id",userInfo._id)
    emailObj['EmailsOwnerId'] = new ObjectId(userInfo._id);
    emailObj['organizationId'] = new ObjectId(organizationId);
    emailObj['connectionId'] = new ObjectId(ids);
    emailObj['templateId'] = new ObjectId(action.data.TemplateId);
    emailObj['createdTime'] = new Date();
    emailObj['updatedTime'] = new Date();

    // //console.log( "sendEmail-->", emailObj)
    await InsertOne("sendEmail", emailObj);
  })
}

async function handleTaskAction(action, organizationId, id) {
  action.data['TasksOwnerId'] = new ObjectId(action.data.TasksOwnerId);
  action.data['organizationId'] = new ObjectId(organizationId);
  action.data['connectionId'] = new ObjectId(id);
  action.data['DueDate'] = new Date(action.data.DueDate);
  action.data['createdTime'] = new Date();
  action.data['updatedTime'] = new Date();

  // //console.log( "Task-->", action.data)
  await InsertOne("tasks", action.data);
}

async function handleCallAction(action, organizationId, userId, id) {
  action.data['CallsOwnerId'] = new ObjectId(action.data.CallsOwnerId);
  action.data['CreatedBy'] = new ObjectId(userId);
  action.data['connectionId'] = new ObjectId(id);
  action.data['organizationId'] = new ObjectId(organizationId);
  action.data['CallStartTime'] = new Date(action.data.CallStartTime);
  action.data['createdTime'] = new Date();
  action.data['updatedTime'] = new Date();

  // //console.log( "Calls-->", action.data);
  await InsertOne("calls", action.data);
}

async function handleMeetingAction(action, organizationId, userId, id) {
  action.data['createdBy'] = new ObjectId(userId);
  action.data['connectionId'] = new ObjectId(id);
  action.data['organizationId'] = new ObjectId(organizationId);
  action.data['createdTime'] = new Date();
  action.data['updatedTime'] = new Date();
  action.data['From'] = new Date(action.data.From);
  action.data['To'] = new Date(action.data.To);

  // //console.log( "meetings-->", action.data)
  await InsertOne("meetings", action.data);
}

function handleAssignOwnerAction(action, req) {
  for (const key in req.body) {
    if (key.endsWith("OwnerId")) {
      req.body[key] = action.data.OwnerId;
    }
  }
}

function handleFieldUpdateAction(action, req) {
  for (const key in action.data) {
    for (const Bodykey in req.body) {
      if (Bodykey.match(key)) {
        req.body[Bodykey] = action.data[key]
      }
    }
  }
}

async function processActions(InstantActions, organizationId, userId, req, res, id, next) {
  for (let i = 0; i < InstantActions.length; i++) {
    const action = InstantActions[i];
    const actionName = action.ActionName.toLowerCase();
    if (actionName.includes("sendemail")) {
      await handleSendEmailAction(action, organizationId, id);
    } else if (actionName.includes("task")) {
      //console.log('Hello')
      await handleTaskAction(action, organizationId, id);
    } else if (actionName.includes("call")) {
      await handleCallAction(action, organizationId, userId, id);
    } else if (actionName.includes("meeting")) {
      await handleMeetingAction(action, organizationId, userId, id);
    } else if (actionName.includes("assignowner")) {
      handleAssignOwnerAction(action, req);
    } else if (actionName.includes("fieldupdate")) {
      // handleFieldUpdateAction(action, req);
    }
  }
  next();
}


// Instant Actions For Apply WorkFlow-Rule
const InstantActions = async (req, res, next) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    const { id } = req.params;
    if (_.isUndefined(req.body.ModuleTitle)) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: "ModuleTitle Is Required !!",
      };
      return Response.error(resp);
    }

    const workFlowData = await Find("workflow", {
      ModuleTitle: req.body.ModuleTitle,
      organizationId: new ObjectId(organizationId),
    });

    if (_.isEmpty(workFlowData)) {
      next();
      return;
    }

    for (const workflow of workFlowData) {
      if (_.isNull(workflow) || workflow.status === false) {
        next();
        return;
      }

      const { when, condition, InstantActions } = workflow;

      if (when.ExecuteAction.create || when.ExecuteAction.edit) {
        const methodCondition =
          req.method === "POST" || req.method === "PATCH";

        const MethodConditionAll =
          (when.ExecuteAction.create &&
            when.ExecuteAction.edit &&
            (req.method === "POST" || req.method === "PATCH")) ||
          (when.ExecuteAction.create && req.method === "POST") ||
          (when.ExecuteAction.edit && req.method === "PATCH");

        if (methodCondition && MethodConditionAll && !req.url.includes("search")) {
          const condition1 = condition.certain.cond1;
          const condition2 = condition.certain.cond2;
          var operator = condition.certain.CriteriaPattern;
          if (operator.includes("or")) {
            operator = "||";
          }
          if (operator.includes("and")) {
            operator = "&&";
          }
          const test1 = req.body[condition1.key] === condition1.value;
          const test2 = req.body[condition2.key] === condition2.value;

          if (eval(`test1 ${operator} test2`)) {
            // //console.log("actions",InstantActions)
            if (id) {
              await processActions(InstantActions, organizationId, userId, req, res, id, next);
            } else {
              let newId = new ObjectId();
              //console.log('newId',newId)
              await processActions(InstantActions, organizationId, userId, req, res, newId, next);
              req.body._id = new ObjectId(newId);
            }
            return;
          }
        }
      }
    }

    next();
  } catch (error) {
    //console.log("Action error", error);
    return handleException(logger, res, error);
  }
};


// ApprovalProcess For Apply ApprovalProcess-Rule
const ApprovalProcess = async (req, res, next) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;

    if (_.isUndefined(req.body.ModuleTitle)) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: "ModuleTitle Is Required !!",
      };
      return Response.error(resp);
    }

    const approvalProcessData = await Find("approvalprocess", {
      ModuleTitle: req.body.ModuleTitle,
      organizationId: new ObjectId(organizationId),
    });

    // //console.log("approvalProcessData--->",approvalProcessData)
    if (_.isEmpty(approvalProcessData)) {
      next();
      return;
    }

    for (const Process of approvalProcessData) {
      if (_.isNull(Process) || Process.status === false) {
        next();
        return;
      }

      const { when, Criteria, WhoApprove, ApprovalAction, RejectionAction } = Process;

      if (when.create || when.edit) {
        const methodCondition =
          req.method === "POST" || req.method === "PATCH";

        const MethodConditionAll =
          (when.create && when.edit && (req.method === "POST" || req.method === "PATCH")) || (when.create && req.method === "POST") ||
          (when.edit && req.method === "PATCH");

        if (methodCondition && MethodConditionAll && !req.url.includes("search")) {
          var matchCondition = {};

          if (Criteria.length > 0) {
            const filterArray = Criteria
            matchCondition = await returnFilterByEquality(
              logger,
              filterArray,
              req.body
            );
          }

          if (matchCondition.includes(false) || WhoApprove.assignTask !== true) {
            next();
            return;
          }

          // const storeData = WhoApprove.tasks.map((task) => {
          //   return {
          //     ...task,
          //     TasksOwnerId: new ObjectId(userId),
          //     organizationId: new ObjectId(organizationId),
          //     createdTime:new Date(),
          //     updatedTime:new Date()
          //   };
          // });
          const storeData = {
            ...WhoApprove.assignTaskValue,
            TasksOwnerId: new ObjectId(userId),
            organizationId: new ObjectId(organizationId),
            createdTime: new Date(),
            updatedTime: new Date()
          }
          await InsertOne("tasks", storeData);

          req.body['ApprovalProcessId'] = Process._id
          req.body['Approver'] = WhoApprove.data
          req.body['ApprovalStatus'] = 'pending'
          next()
        }
      }
    }

    next();
  } catch (error) {
    //console.log("Action error", error);
    return handleException(logger, res, error);
  }
};

module.exports = {
  InstantActions,
  ApprovalProcess
};
