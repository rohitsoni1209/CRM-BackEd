const bcrypt = require("bcrypt");
const { handleException } = require("../../helpers/exception");
const Response = require("../../helpers/response");
const Constant = require("../../helpers/constant");
const ProfileValidation = require("../../helpers/joi-validation");
const { dataCopy } = require("../../utility/dataCopy");
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
  Delete,
} = require("../../library/methods");
/**
 * Create form
 */
/*
const convertDataLeadToOther = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;

    const leadInfo = await FindOne("leads", {
      _id: new ObjectId(req.body.leadId),
    });
    //console.log("leadInfo---Info", leadInfo)
    // const { FirstName, LastName } = await FindOne("users", {
    //   _id: new ObjectId(leadInfo.LeadsOwnerId),
    // });
    // let userName = FirstName + " " + LastName

    if (!leadInfo) {
      const resp = {
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.ERROR_MSGS.DATA_NOT_FOUND,
      };
      return Response.error(resp);
    }
    const { addExist, mergeExist, newCompanyName, email, mobile } = req.body?.newData
    //check CompanyName in account and email/phone in Contact
    // if (newCompanyName != "") {
    //   leadInfo.Company = newCompanyName;
    // }
    // if (email != "") {
    //   leadInfo.Email = email;
    // }
    // if (mobile != "") {
    //   leadInfo.Mobile = mobile;
    // }
    let companyExists = null;
    let mobileExisit = null;
    let emailExisit = null;
    if (addExist == false) {
      companyExists = await FindOne("accounts", {
        Company: leadInfo.Company,
      });
    } else {

    }
    if (mergeExist === false) {
      mobileExisit = await FindOne("contacts", { Mobile: leadInfo.Mobile });
      emailExisit = await FindOne("contacts", { Email: leadInfo.Email });
    } else {

    }
    //{ Mobile: leadInfo.Mobile } 
    // const contactExists = await FindOne("contacts", {
    //   $or: [
    //     { Mobile: leadInfo.Mobile },
    //     { Email: leadInfo.Email }
    //   ]
    // });

    if (companyExists || emailExisit || mobileExisit) {
      const messages = {};
      const mg = [];

      if (companyExists) {
        messages.account = `Company name "${leadInfo.Company}" already present.`;
        mg.push(`Company name "${leadInfo.Company}" already present.`);
      }

      if (emailExisit || mobileExisit) {
        console.log("lead", emailExisit, mobileExisit)
        if (emailExisit && mobileExisit) {
          messages.contact = "Please enter a mobile number and an email address.";
          messages.state = 0;
        } else if (mobileExisit) {
          messages.contact = "Please enter a mobile number.";
          messages.state = 1;
        } else if (emailExisit) {
          messages.contact = "Please enter an email address.";
          messages.state = 2;
          // } else if (contactExists) {
          //   messages.contact = `Contact with the same mobile number "${leadInfo.Mobile}" or email "${leadInfo.Email}" already exists.`;
          //   messages.state = 0;
        }
      }

      messages.error = "Error";
      const resp = {
        res,
        status: Constant.STATUS_CODE.OK,
        msg: mg.join(", "),
        data: messages,
      };
      //res, headers, status, msg, data

      return Response.success(resp);
      //end check
    } else {
      delete leadInfo._id;
      delete leadInfo.createdTime;
      delete leadInfo.updatedTime;
      // //console.log(leadInfo);
      if (addExist === false) {

        // Create contacts

        const contactsInfo = await FindOne("contacts", {
          LeadID: new ObjectId(req.body.leadId),
        });
        if (contactsInfo) {
          const resp = {
            res,
            status: Constant.STATUS_CODE.BAD_REQUEST,
            msg: Constant.ERROR_MSGS.CONVERTED,
          };
          return Response.error(resp);
        }
        leadInfo.AccountName = leadInfo.Company;
        // //console.log("leadInfo---accounts",leadInfo)
        leadInfo.AccountsOwnerId = new ObjectId(leadInfo.LeadsOwnerId);
        const AccountDataS = await InsertOne("accounts", leadInfo);

        await dataCopy('tasks', req.body.leadId, AccountDataS.insertedId);
        await dataCopy('calls', req.body.leadId, AccountDataS.insertedId);
        await dataCopy('meetings', req.body.leadId, AccountDataS.insertedId);
        await dataCopy('sitevisits', req.body.leadId, AccountDataS.insertedId);
        await dataCopy('note', req.body.leadId, AccountDataS.insertedId);
        await dataCopy('saleOrders', req.body.leadId, AccountDataS.insertedId);
        await dataCopy('purchaseOrders', req.body.leadId, AccountDataS.insertedId);
        await dataCopy('quotes', req.body.leadId, AccountDataS.insertedId);
        await dataCopy('invoices', req.body.leadId, AccountDataS.insertedId);
        await dataCopy('inventory', req.body.leadId, AccountDataS.insertedId);


        delete leadInfo.AccountsOwnerId;
        // delete leadInfo.AccountName;
        // leadInfo.AccountName = new ObjectId(AccountDataS.insertedId)
        leadInfo.LeadID = new ObjectId(req.body.leadId);
        leadInfo.ContactsOwnerId = new ObjectId(leadInfo.LeadsOwnerId);
        leadInfo.createdTime = new Date();
        leadInfo.updatedTime = new Date();
        // //console.log("leadInfo---Contact",leadInfo)
        const ContactData = await InsertOne("contacts", leadInfo);

        await dataCopy('tasks', req.body.leadId, ContactData.insertedId);
        await dataCopy('calls', req.body.leadId, ContactData.insertedId);
        await dataCopy('meetings', req.body.leadId, ContactData.insertedId);
        await dataCopy('sitevisits', req.body.leadId, ContactData.insertedId);
        await dataCopy('note', req.body.leadId, ContactData.insertedId);
        await dataCopy('saleOrders', req.body.leadId, ContactData.insertedId);
        await dataCopy('purchaseOrders', req.body.leadId, ContactData.insertedId);
        await dataCopy('quotes', req.body.leadId, ContactData.insertedId);
        await dataCopy('invoices', req.body.leadId, ContactData.insertedId);
        await dataCopy('inventory', req.body.leadId, ContactData.insertedId);
        delete leadInfo.ContactsOwnerId;



        if (req.body.opportunities) {
          leadInfo.ContactName = new ObjectId(ContactData.insertedId)
          leadInfo.LeadType = req.body.opportunitiesData.leadType;
          leadInfo.OpportunityName = req.body.opportunitiesData.OpportunityName;
          leadInfo.ClosingDate = new Date(req.body.opportunitiesData.closingDate);
          leadInfo.CampaignSource = req.body.opportunitiesData.campaignSource;
          leadInfo.OpportunitiesOwnerId = new ObjectId(leadInfo.LeadsOwnerId);
          if (req.body.opportunitiesData.Pipeline) {
            leadInfo.Pipeline = new ObjectId(req.body.opportunitiesData.Pipeline);
          } else {
            leadInfo.Pipeline = null;
          }
          if (req.body.opportunitiesData.Stage) {
            leadInfo.Stage = new ObjectId(req.body.opportunitiesData.Stage);
          } else {
            leadInfo.Stage = null;
          }
          // //console.log('leadInfo-->',leadInfo)
          const newDealData = await InsertOne("deals", leadInfo);

          dataCopy('tasks', req.body.leadId, newDealData.insertedId);
          dataCopy('calls', req.body.leadId, newDealData.insertedId);
          dataCopy('meetings', req.body.leadId, newDealData.insertedId);
          dataCopy('sitevisits', req.body.leadId, newDealData.insertedId);
          dataCopy('note', req.body.leadId, newDealData.insertedId);
          dataCopy('saleOrders', req.body.leadId, newDealData.insertedId);
          dataCopy('purchaseOrders', req.body.leadId, newDealData.insertedId);
          dataCopy('quotes', req.body.leadId, newDealData.insertedId);
          dataCopy('invoices', req.body.leadId, newDealData.insertedId);

        }
        await Delete("leads", { _id: new ObjectId(req.body.leadId) });



        const obj = {
          res,
          msg: Constant.INFO_MSGS.CREATED_SUCCESSFULLY,
          status: Constant.STATUS_CODE.OK,
        };
        return Response.success(obj);
      } else if (mergeExist === true && addExist === true) {
        leadInfo.AccountName = leadInfo.Company;
        // //console.log("leadInfo---accounts",leadInfo)
        // leadInfo.AccountsOwnerId = new ObjectId(leadInfo.LeadsOwnerId);
        // const AccountDataS = await InsertOne("accounts", leadInfo);

        // await dataCopy('tasks', req.body.leadId, AccountDataS.insertedId);
        // await dataCopy('calls', req.body.leadId, AccountDataS.insertedId);
        // await dataCopy('meetings', req.body.leadId, AccountDataS.insertedId);
        // await dataCopy('sitevisits', req.body.leadId, AccountDataS.insertedId);
        // await dataCopy('note', req.body.leadId, AccountDataS.insertedId);
        // await dataCopy('saleOrders', req.body.leadId, AccountDataS.insertedId);
        // await dataCopy('purchaseOrders', req.body.leadId, AccountDataS.insertedId);
        // await dataCopy('quotes', req.body.leadId, AccountDataS.insertedId);
        // await dataCopy('invoices', req.body.leadId, AccountDataS.insertedId);
        // await dataCopy('inventory', req.body.leadId, AccountDataS.insertedId);


        // delete leadInfo.AccountsOwnerId;
        // delete leadInfo.AccountName;
        // leadInfo.AccountName = new ObjectId(AccountDataS.insertedId)
        leadInfo.LeadID = new ObjectId(req.body.leadId);
        leadInfo.ContactsOwnerId = new ObjectId(leadInfo.LeadsOwnerId);
        leadInfo.createdTime = new Date();
        leadInfo.updatedTime = new Date();
        // //console.log("leadInfo---Contact",leadInfo)
        const ContactData = await InsertOne("contacts", leadInfo);

        await dataCopy('tasks', req.body.leadId, ContactData.insertedId);
        await dataCopy('calls', req.body.leadId, ContactData.insertedId);
        await dataCopy('meetings', req.body.leadId, ContactData.insertedId);
        await dataCopy('sitevisits', req.body.leadId, ContactData.insertedId);
        await dataCopy('note', req.body.leadId, ContactData.insertedId);
        await dataCopy('saleOrders', req.body.leadId, ContactData.insertedId);
        await dataCopy('purchaseOrders', req.body.leadId, ContactData.insertedId);
        await dataCopy('quotes', req.body.leadId, ContactData.insertedId);
        await dataCopy('invoices', req.body.leadId, ContactData.insertedId);
        await dataCopy('inventory', req.body.leadId, ContactData.insertedId);
        delete leadInfo.ContactsOwnerId;



        if (req.body.opportunities) {
          leadInfo.ContactName = new ObjectId(ContactData.insertedId)
          leadInfo.LeadType = req.body.opportunitiesData.leadType;
          leadInfo.OpportunityName = req.body.opportunitiesData.OpportunityName;
          leadInfo.ClosingDate = new Date(req.body.opportunitiesData.closingDate);
          leadInfo.CampaignSource = req.body.opportunitiesData.campaignSource;
          leadInfo.OpportunitiesOwnerId = new ObjectId(leadInfo.LeadsOwnerId);
          if (req.body.opportunitiesData.Pipeline) {
            leadInfo.Pipeline = new ObjectId(req.body.opportunitiesData.Pipeline);
          } else {
            leadInfo.Pipeline = null;
          }
          if (req.body.opportunitiesData.Stage) {
            leadInfo.Stage = new ObjectId(req.body.opportunitiesData.Stage);
          } else {
            leadInfo.Stage = null;
          }
          // //console.log('leadInfo-->',leadInfo)
          const newDealData = await InsertOne("deals", leadInfo);

          dataCopy('tasks', req.body.leadId, newDealData.insertedId);
          dataCopy('calls', req.body.leadId, newDealData.insertedId);
          dataCopy('meetings', req.body.leadId, newDealData.insertedId);
          dataCopy('sitevisits', req.body.leadId, newDealData.insertedId);
          dataCopy('note', req.body.leadId, newDealData.insertedId);
          dataCopy('saleOrders', req.body.leadId, newDealData.insertedId);
          dataCopy('purchaseOrders', req.body.leadId, newDealData.insertedId);
          dataCopy('quotes', req.body.leadId, newDealData.insertedId);
          dataCopy('invoices', req.body.leadId, newDealData.insertedId);

        }
        await Delete("leads", { _id: new ObjectId(req.body.leadId) });



        const obj = {
          res,
          msg: Constant.INFO_MSGS.CREATED_SUCCESSFULLY,
          status: Constant.STATUS_CODE.OK,
        };
        return Response.success(obj);
      } else {
        leadInfo.AccountName = leadInfo.Company;
        // //console.log("leadInfo---accounts",leadInfo)
        // leadInfo.AccountsOwnerId = new ObjectId(leadInfo.LeadsOwnerId);
        // const AccountDataS = await InsertOne("accounts", leadInfo);

        // await dataCopy('tasks', req.body.leadId, AccountDataS.insertedId);
        // await dataCopy('calls', req.body.leadId, AccountDataS.insertedId);
        // await dataCopy('meetings', req.body.leadId, AccountDataS.insertedId);
        // await dataCopy('sitevisits', req.body.leadId, AccountDataS.insertedId);
        // await dataCopy('note', req.body.leadId, AccountDataS.insertedId);
        // await dataCopy('saleOrders', req.body.leadId, AccountDataS.insertedId);
        // await dataCopy('purchaseOrders', req.body.leadId, AccountDataS.insertedId);
        // await dataCopy('quotes', req.body.leadId, AccountDataS.insertedId);
        // await dataCopy('invoices', req.body.leadId, AccountDataS.insertedId);
        // await dataCopy('inventory', req.body.leadId, AccountDataS.insertedId);


        // delete leadInfo.AccountsOwnerId;
        // delete leadInfo.AccountName;
        // leadInfo.AccountName = new ObjectId(AccountDataS.insertedId)
        leadInfo.LeadID = new ObjectId(req.body.leadId);
        leadInfo.ContactsOwnerId = new ObjectId(leadInfo.LeadsOwnerId);
        leadInfo.createdTime = new Date();
        leadInfo.updatedTime = new Date();
        // //console.log("leadInfo---Contact",leadInfo)
        const ContactData = await InsertOne("contacts", leadInfo);

        await dataCopy('tasks', req.body.leadId, ContactData.insertedId);
        await dataCopy('calls', req.body.leadId, ContactData.insertedId);
        await dataCopy('meetings', req.body.leadId, ContactData.insertedId);
        await dataCopy('sitevisits', req.body.leadId, ContactData.insertedId);
        await dataCopy('note', req.body.leadId, ContactData.insertedId);
        await dataCopy('saleOrders', req.body.leadId, ContactData.insertedId);
        await dataCopy('purchaseOrders', req.body.leadId, ContactData.insertedId);
        await dataCopy('quotes', req.body.leadId, ContactData.insertedId);
        await dataCopy('invoices', req.body.leadId, ContactData.insertedId);
        await dataCopy('inventory', req.body.leadId, ContactData.insertedId);
        delete leadInfo.ContactsOwnerId;



        if (req.body.opportunities) {
          leadInfo.ContactName = new ObjectId(ContactData.insertedId)
          leadInfo.LeadType = req.body.opportunitiesData.leadType;
          leadInfo.OpportunityName = req.body.opportunitiesData.OpportunityName;
          leadInfo.ClosingDate = new Date(req.body.opportunitiesData.closingDate);
          leadInfo.CampaignSource = req.body.opportunitiesData.campaignSource;
          leadInfo.OpportunitiesOwnerId = new ObjectId(leadInfo.LeadsOwnerId);
          if (req.body.opportunitiesData.Pipeline) {
            leadInfo.Pipeline = new ObjectId(req.body.opportunitiesData.Pipeline);
          } else {
            leadInfo.Pipeline = null;
          }
          if (req.body.opportunitiesData.Stage) {
            leadInfo.Stage = new ObjectId(req.body.opportunitiesData.Stage);
          } else {
            leadInfo.Stage = null;
          }
          // //console.log('leadInfo-->',leadInfo)
          const newDealData = await InsertOne("deals", leadInfo);

          dataCopy('tasks', req.body.leadId, newDealData.insertedId);
          dataCopy('calls', req.body.leadId, newDealData.insertedId);
          dataCopy('meetings', req.body.leadId, newDealData.insertedId);
          dataCopy('sitevisits', req.body.leadId, newDealData.insertedId);
          dataCopy('note', req.body.leadId, newDealData.insertedId);
          dataCopy('saleOrders', req.body.leadId, newDealData.insertedId);
          dataCopy('purchaseOrders', req.body.leadId, newDealData.insertedId);
          dataCopy('quotes', req.body.leadId, newDealData.insertedId);
          dataCopy('invoices', req.body.leadId, newDealData.insertedId);

        }
        await Delete("leads", { _id: new ObjectId(req.body.leadId) });



        const obj = {
          res,
          msg: Constant.INFO_MSGS.CREATED_SUCCESSFULLY,
          status: Constant.STATUS_CODE.OK,
        };
        return Response.success(obj);
      }
    }
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};
*/

const convertDataLeadToOther = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    const { leadId, newData, opportunitiesData, opportunities } = req.body;
    const { companyAction, addExist, mergeExist, newCompanyName, email, mobile, accoutName, accoutId } = newData;

    const leadInfo = await FindOne("leads", { _id: new ObjectId(leadId) });

    if (!leadInfo) {
      return Response.error({
        res,
        status: Constant.STATUS_CODE.BAD_REQUEST,
        msg: Constant.ERROR_MSGS.DATA_NOT_FOUND,
      });
    }

    const companyExistsArray = companyAction === "skipe" ? await Find("accounts", { AccountName: leadInfo.Company, organizationId: new ObjectId(organizationId) }) : null;
    const companyExists = companyExistsArray ? companyExistsArray[0] : null;
    let emailExists;
    let mobileExists
    if (email !== "" && email != undefined) {
      emailExists = !mergeExist && leadInfo.Email ? await FindOne("contacts", { Email: email, organizationId: new ObjectId(organizationId) }) : null;
    } else {
      emailExists = !mergeExist && leadInfo.Email ? await FindOne("contacts", { Email: leadInfo.Email, organizationId: new ObjectId(organizationId) }) : null;
    }
    if (mobile !== "" && mobile != undefined) {
      mobileExists = !mergeExist && leadInfo.Mobile ? await FindOne("contacts", { Mobile: mobile, organizationId: new ObjectId(organizationId) }) : null;
    } else {
      mobileExists = !mergeExist && leadInfo.Mobile ? await FindOne("contacts", { Mobile: leadInfo.Mobile, organizationId: new ObjectId(organizationId) }) : null;
    }



    if (companyExists || emailExists || mobileExists) {
      const messages = generateMessages(companyExists, emailExists, mobileExists, companyExistsArray, leadInfo);
      return Response.success({
        res,
        status: Constant.STATUS_CODE.OK,
        msg: messages.mg.join(", "),
        data: messages?.messages,
      });
    }

    await processLeadConversion(req, res, leadInfo, opportunities, opportunitiesData, addExist, mergeExist, companyAction);

  } catch (error) {
    return handleException(logger, res, error);
  }
};

const generateMessages = (companyExists, emailExists, mobileExists, companyExistsArray, leadInfo) => {
  const messages = {};
  const mg = [];

  if (companyExists) {
    console.log("CompanyExists", companyExistsArray);
    messages.account = `Company name "${companyExists.AccountName}" already present.`;
    mg.push(`Company name "${companyExists.AccountName}" already present.`);
    messages.companyList = companyExistsArray;
  }

  if (emailExists || mobileExists) {
    if (emailExists && mobileExists) {
      messages.contact = "Please enter a mobile number and an email address.";
      messages.state = 0;
    } else if (mobileExists) {
      messages.contact = "Please enter a mobile number.";
      messages.state = 1;
    } else if (emailExists) {
      messages.contact = "Please enter an email address.";
      messages.state = 2;
    }
  }

  messages.error = "Error";
  return { messages, mg };
};

const processLeadConversion = async (req, res, leadInfo, opportunities, opportunitiesData, addExist, mergeExist, companyAction) => {
  const { leadId, newData } = req.body;
  const { newCompanyName, email, mobile, accoutName, accoutId } = newData;

  delete leadInfo._id;
  delete leadInfo.createdTime;
  delete leadInfo.updatedTime;

  switch (companyAction) {
    case "add":
      await handleAddCompanyAction(req, leadInfo, opportunities, opportunitiesData, mergeExist, leadId, accoutName, accoutId, email, mobile);
      break;
    case "create":
      await handleCreateCompanyAction(req, leadInfo, opportunities, opportunitiesData, mergeExist, leadId, email, mobile);
      break;
    default:
      await handleDefaultCompanyAction(req, leadInfo, opportunities, opportunitiesData, addExist, leadId, email, mobile);
      break;
  }

  return Response.success({
    res,
    msg: Constant.INFO_MSGS.CREATED_SUCCESSFULLY,
    status: Constant.STATUS_CODE.OK,
  });
};

const handleAddCompanyAction = async (req, leadInfo, opportunities, opportunitiesData, mergeExist, leadId, accoutName, accoutId, email, mobile) => {
  if (mergeExist) {
    const existingContact = await FindOne("contacts", { Mobile: leadInfo.Mobile, Email: leadInfo.Email });
    if (existingContact) {
      const updatedContact = {
        ...existingContact,
        ...leadInfo,
        // Company: accoutName || leadInfo.Company,
        AccountName: accoutName || leadInfo.Company,
        AccountsOwnerId: new ObjectId(accoutId || leadInfo.LeadsOwnerId),
        Email: email || leadInfo.Email,
        Mobile: mobile || leadInfo.Mobile,
        updatedTime: new Date(),
      };

      await UpdateOne("contacts", { _id: existingContact._id }, updatedContact);
      await copyRelatedData(leadId, existingContact._id);
      if (opportunities) {
        await createNewDeal(req, leadInfo, opportunitiesData, existingContact._id);
      }
      await Delete("leads", { _id: new ObjectId(leadId) });
    }
  } else {
    if (email !== "") {
      leadId.Email = email;
    }
    if (mobile !== "") {
      leadId.Mobile = mobile;
    }
    await insertNewContact(req, leadInfo, opportunities, opportunitiesData, leadId, accoutName, accoutId, email, mobile);
    await Delete("leads", { _id: new ObjectId(leadId) });
  }
};

const handleCreateCompanyAction = async (req, leadInfo, opportunities, opportunitiesData, mergeExist, leadId, email, mobile) => {
  leadInfo.AccountName = leadInfo.Company;
  leadInfo.AccountsOwnerId = new ObjectId(leadInfo.LeadsOwnerId);
  console.log("LEAD info", leadInfo)
  let cname = leadInfo.Company;
  delete leadInfo.Company;
  const accountData = await InsertOne("accounts", leadInfo);
  console.log("LEAD info accountData", leadId, accountData)

  await copyRelatedData(leadId, accountData.insertedId);

  if (mergeExist) {
    const existingContact = await FindOne("contacts", { Mobile: leadInfo.Mobile, Email: leadInfo.Email });
    if (existingContact) {
      const updatedContact = {
        ...existingContact,
        ...leadInfo,
        // Company: leadInfo.Company,
        Email: email || leadInfo.Email,
        Mobile: mobile || leadInfo.Mobile,
        updatedTime: new Date(),
      };

      await UpdateOne("contacts", { _id: existingContact._id }, updatedContact);
      await copyRelatedData(leadId, existingContact._id);
      if (opportunities) {
        await createNewDeal(req, leadInfo, opportunitiesData, existingContact._id);
      }
      leadInfo.Company = cname;
      await Delete("leads", { _id: new ObjectId(leadId) });
    }
  } else {
    if (email !== "" || mobile !== "") {
      leadId.Email = email;
      leadId.Mobile = mobile;
    }
    await insertNewContact(req, leadInfo, opportunities, opportunitiesData, leadId);
  }

  // if (opportunities) {
  //   await createNewDeal(req, leadInfo, opportunitiesData, accountData.insertedId);
  // }
  await Delete("leads", { _id: new ObjectId(leadId) });
};

const handleDefaultCompanyAction = async (req, leadInfo, opportunities, opportunitiesData, addExist, leadId, email, mobile) => {
  await insertNewContact(req, leadInfo, opportunities, opportunitiesData, leadId);

  if (!addExist) {
    leadInfo.AccountName = leadInfo.Company;
    leadInfo.AccountsOwnerId = new ObjectId(leadInfo.LeadsOwnerId);
    let cname = leadInfo.Company;
    delete leadInfo.Company;
    const accountData = await InsertOne("accounts", leadInfo);
    await copyRelatedData(leadId, accountData.insertedId);
    leadInfo.Company = cname;
  }

  await Delete("leads", { _id: new ObjectId(leadId) });
};

const insertNewContact = async (req, leadInfo, opportunities, opportunitiesData, leadId, accoutName = null, accoutId = null, email = null, mobile = null) => {
  leadInfo.LeadID = new ObjectId(leadId);
  leadInfo.ContactsOwnerId = new ObjectId(leadInfo.LeadsOwnerId);
  leadInfo.createdTime = new Date();
  leadInfo.updatedTime = new Date();
  // leadInfo.Company = accoutName || leadInfo.Company;
  leadInfo.AccountName = accoutName || leadInfo.Company;
  leadInfo.AccountsOwnerId = new ObjectId(accoutId || leadInfo.LeadsOwnerId);
  leadInfo.Email = email || leadInfo.Email;
  leadInfo.Mobile = mobile || leadInfo.Mobile;
  let cname = leadInfo.Company;
  delete leadInfo.Company;
  const contactData = await InsertOne("contacts", leadInfo);
  leadInfo.Company = cname;
  await copyRelatedData(leadId, contactData.insertedId);

  if (opportunities) {
    await createNewDeal(req, leadInfo, opportunitiesData, contactData.insertedId);
  }
};

const copyRelatedData = async (sourceId, targetId) => {
  const collections = ['tasks', 'calls', 'meetings', 'sitevisits', 'note', 'saleOrders', 'purchaseOrders', 'quotes', 'invoices', 'inventory'];
  for (const collection of collections) {
    await dataCopy(collection, sourceId, targetId);
  }
};

const createNewDeal = async (req, leadInfo, opportunitiesData, contactId) => {
  try {
    let cname= leadInfo.Company;
    delete leadInfo.Company;
    const dealInfo = {
      ...leadInfo,
      ContactName: new ObjectId(contactId),
      LeadType: opportunitiesData.leadType,
      OpportunityName: opportunitiesData.OpportunityName,
      ClosingDate: new Date(opportunitiesData.closingDate),
      CampaignSource: opportunitiesData.campaignSource,
      OpportunitiesOwnerId: new ObjectId(leadInfo.LeadsOwnerId),
      Pipeline: opportunitiesData.Pipeline ? new ObjectId(opportunitiesData.Pipeline) : null,
      Stage: opportunitiesData.Stage ? new ObjectId(opportunitiesData.Stage) : null,
    };

    const newDealData = await InsertOne("deals", dealInfo);
    leadInfo.Company = cname;
    await copyRelatedData(req.body.leadId, newDealData.insertedId);
  } catch (error) {
    console.error("ERROR", error);
  }
};



/**
 * Update Tuch
 */
const updateTuch = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    const { id, module } = req.body;

    // update Lead
    if (module == "leads") {
      await UpdateOne("leads", { _id: new ObjectId(id) }, { tuch: true });
    }
    if (module == "deals") {
      await UpdateOne("deals", { _id: new ObjectId(id) }, { tuch: true });
    }
    if (module == "contacts") {
      await UpdateOne("contacts", { _id: new ObjectId(id) }, { tuch: true });
    }
    if (module == "accounts") {
      await UpdateOne("accounts", { _id: new ObjectId(id) }, { tuch: true });
    }

    const obj = {
      res,
      msg: Constant.INFO_MSGS.UPDATED_SUCCESSFULLY,
      status: Constant.STATUS_CODE.OK,
      // data: userDetails,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

module.exports = {
  convertDataLeadToOther,
  updateTuch,
};
