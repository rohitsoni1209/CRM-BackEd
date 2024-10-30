const { handleException } = require("../../helpers/exception");
const Response = require("../../helpers/response");
const Constant = require("../../helpers/constant");
const { ObjectId } = require("mongodb");
const _ = require("underscore");
const fs = require("fs");
const path = require("path");
const {
  Find,
  Insert,
  InsertOne,
  Aggregation,
  UpdateOne,
  FindOne,
  Count,
  DeleteMany,
} = require("../../library/methods");
/**
 * Create Demo-Form
 */
const createDemoForm = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    //console.log('organizationId',organizationId)
    //-------<START>-------- DUMMY FORMS JSON READ AND COVERT IN TO PARSE -------------------
    //--------------- MAKE OBJECT FOR INSERT DOCUMENT -------------------

    //Leads Form Add
    const LeadsObject = {};
    const LeadsData = fs.readFileSync(
      path.join(__dirname, "../../Demo-form/coworking/lead.json"),
      "utf-8"
    );
    const LeadsParsedata = JSON.parse(LeadsData);
    Object.assign(LeadsObject, LeadsParsedata);
    LeadsObject["FormsOwnerId"] = new ObjectId(userId);
    LeadsObject["CreatedBy"] = new ObjectId(userId);
    LeadsObject["organizationId"] = new ObjectId(organizationId);
    LeadsObject["createdTime"] = new Date();
    LeadsObject["updatedTime"] = new Date();

    //Account Form Add
    const AccountObject = {};
    const AccountData = fs.readFileSync(
      path.join(__dirname, "../../Demo-form/coworking/account.json"),
      "utf-8"
    );
    const AccountParsedata = JSON.parse(AccountData);
    Object.assign(AccountObject, AccountParsedata);
    AccountObject["FormsOwnerId"] = new ObjectId(userId);
    AccountObject["CreatedBy"] = new ObjectId(userId);
    AccountObject["organizationId"] = new ObjectId(organizationId);
    AccountObject["createdTime"] = new Date();
    AccountObject["updatedTime"] = new Date();

    //contact Form Add
    const contactObject = {};
    const contactData = fs.readFileSync(
      path.join(__dirname, "../../Demo-form/coworking/contact.json"),
      "utf-8"
    );
    const contactParsedata = JSON.parse(contactData);
    Object.assign(contactObject, contactParsedata);
    contactObject["FormsOwnerId"] = new ObjectId(userId);
    contactObject["CreatedBy"] = new ObjectId(userId);
    contactObject["organizationId"] = new ObjectId(organizationId);
    contactObject["createdTime"] = new Date();
    contactObject["updatedTime"] = new Date();

    //task Form Add
    const taskObject = {};
    const taskData = fs.readFileSync(
      path.join(__dirname, "../../Demo-form/coworking/task.json"),
      "utf-8"
    );
    const taskParsedata = JSON.parse(taskData);
    Object.assign(taskObject, taskParsedata);
    taskObject["FormsOwnerId"] = new ObjectId(userId);
    taskObject["CreatedBy"] = new ObjectId(userId);
    taskObject["organizationId"] = new ObjectId(organizationId);
    taskObject["createdTime"] = new Date();
    taskObject["updatedTime"] = new Date();

    //task Form opportunities
    const opportunitiesObject = {};
    const opportunitiesData = fs.readFileSync(
      path.join(__dirname, "../../Demo-form/coworking/opportunities.json"),
      "utf-8"
    );
    const opportunitiesParsedata = JSON.parse(opportunitiesData);
    Object.assign(opportunitiesObject, opportunitiesParsedata);
    opportunitiesObject["FormsOwnerId"] = new ObjectId(userId);
    opportunitiesObject["CreatedBy"] = new ObjectId(userId);
    opportunitiesObject["organizationId"] = new ObjectId(organizationId);
    opportunitiesObject["createdTime"] = new Date();
    opportunitiesObject["updatedTime"] = new Date();

    //task Form inventory
    const inventoryObject = {};
    const inventoryData = fs.readFileSync(
      path.join(__dirname, "../../Demo-form/coworking/inventory.json"),
      "utf-8"
    );
    const inventoryParsedata = JSON.parse(inventoryData);
    Object.assign(inventoryObject, inventoryParsedata);
    inventoryObject["FormsOwnerId"] = new ObjectId(userId);
    inventoryObject["CreatedBy"] = new ObjectId(userId);
    inventoryObject["organizationId"] = new ObjectId(organizationId);
    inventoryObject["createdTime"] = new Date();
    inventoryObject["updatedTime"] = new Date();

    //Call Form Add
    const CallsObject = {};
    const CallsData = fs.readFileSync(
      path.join(__dirname, "../../Demo-form/coworking/call.json"),
      "utf-8"
    );
    const CallsParsedata = JSON.parse(CallsData);
    Object.assign(CallsObject, CallsParsedata);
    CallsObject["FormsOwnerId"] = new ObjectId(userId);
    CallsObject["CreatedBy"] = new ObjectId(userId);
    CallsObject["organizationId"] = new ObjectId(organizationId);
    CallsObject["createdTime"] = new Date();
    CallsObject["updatedTime"] = new Date();

    //meeting Form Add
    const meetingObject = {};
    const meetingData = fs.readFileSync(
      path.join(__dirname, "../../Demo-form/coworking/meeting.json"),
      "utf-8"
    );
    const meetingParsedata = JSON.parse(meetingData);
    Object.assign(meetingObject, meetingParsedata);
    meetingObject["FormsOwnerId"] = new ObjectId(userId);
    meetingObject["CreatedBy"] = new ObjectId(userId);
    meetingObject["organizationId"] = new ObjectId(organizationId);
    meetingObject["createdTime"] = new Date();
    meetingObject["updatedTime"] = new Date();

    //note Form Add
    const noteObject = {};
    const noteData = fs.readFileSync(
      path.join(__dirname, "../../Demo-form/coworking/note.json"),
      "utf-8"
    );
    const noteParsedata = JSON.parse(noteData);
    Object.assign(noteObject, noteParsedata);
    noteObject["FormsOwnerId"] = new ObjectId(userId);
    noteObject["CreatedBy"] = new ObjectId(userId);
    noteObject["organizationId"] = new ObjectId(organizationId);
    noteObject["createdTime"] = new Date();
    noteObject["updatedTime"] = new Date();

    //quotes Form Add
    const quotesObject = {};
    const quotesData = fs.readFileSync(
      path.join(__dirname, "../../Demo-form/coworking/quotes.json"),
      "utf-8"
    );
    const quotesParsedata = JSON.parse(quotesData);
    Object.assign(quotesObject, quotesParsedata);
    quotesObject["FormsOwnerId"] = new ObjectId(userId);
    quotesObject["CreatedBy"] = new ObjectId(userId);
    quotesObject["organizationId"] = new ObjectId(organizationId);
    quotesObject["createdTime"] = new Date();
    quotesObject["updatedTime"] = new Date();

    //Sales Form Add
    const salesOrderObject = {};
    const salesOrderData = fs.readFileSync(
      path.join(__dirname, "../../Demo-form/coworking/salesOrder.json"),
      "utf-8"
    );
    const salesOrderParsedata = JSON.parse(salesOrderData);
    Object.assign(salesOrderObject, salesOrderParsedata);
    salesOrderObject["FormsOwnerId"] = new ObjectId(userId);
    salesOrderObject["CreatedBy"] = new ObjectId(userId);
    salesOrderObject["organizationId"] = new ObjectId(organizationId);
    salesOrderObject["createdTime"] = new Date();
    salesOrderObject["updatedTime"] = new Date();

    //quotes Form Add
    const invoiceObject = {};
    const invoiceData = fs.readFileSync(
      path.join(__dirname, "../../Demo-form/coworking/invoice.json"),
      "utf-8"
    );
    const invoiceParsedata = JSON.parse(invoiceData);
    Object.assign(invoiceObject, invoiceParsedata);
    invoiceObject["FormsOwnerId"] = new ObjectId(userId);
    invoiceObject["CreatedBy"] = new ObjectId(userId);
    invoiceObject["organizationId"] = new ObjectId(organizationId);
    invoiceObject["createdTime"] = new Date();
    invoiceObject["updatedTime"] = new Date();

    //siteVisit Form Add
    const siteVisitObject = {};
    const siteVisitData = fs.readFileSync(
      path.join(__dirname, "../../Demo-form/coworking/siteVisit.json"),
      "utf-8"
    );
    const siteVisitParsedata = JSON.parse(siteVisitData);
    Object.assign(siteVisitObject, siteVisitParsedata);
    siteVisitObject["FormsOwnerId"] = new ObjectId(userId);
    siteVisitObject["CreatedBy"] = new ObjectId(userId);
    siteVisitObject["organizationId"] = new ObjectId(organizationId);
    siteVisitObject["createdTime"] = new Date();
    siteVisitObject["updatedTime"] = new Date();

    //vendor Form Add
    const vendorObject = {};
    const vendorData = fs.readFileSync(
      path.join(__dirname, "../../Demo-form/coworking/vendor.json"),
      "utf-8"
    );
    const vendorParsedata = JSON.parse(vendorData);
    Object.assign(vendorObject, vendorParsedata);
    vendorObject["FormsOwnerId"] = new ObjectId(userId);
    vendorObject["CreatedBy"] = new ObjectId(userId);
    vendorObject["organizationId"] = new ObjectId(organizationId);
    vendorObject["createdTime"] = new Date();
    vendorObject["updatedTime"] = new Date();

    //channelPartner Form Add
    const channelPartnerObject = {};
    const channelPartnerData = fs.readFileSync(
      path.join(__dirname, "../../Demo-form/coworking/channelPartner.json"),
      "utf-8"
    );
    const channelPartnerParsedata = JSON.parse(channelPartnerData);
    Object.assign(channelPartnerObject, channelPartnerParsedata);
    channelPartnerObject["FormsOwnerId"] = new ObjectId(userId);
    channelPartnerObject["CreatedBy"] = new ObjectId(userId);
    channelPartnerObject["organizationId"] = new ObjectId(organizationId);
    channelPartnerObject["createdTime"] = new Date();
    channelPartnerObject["updatedTime"] = new Date();
    //console.log('channelPartnerObject',channelPartnerObject)
    //-------<END>-------- DUMMY FORMS JSON READ AND COVERT IN TO PARSE -------------------

    // Create Form
    await InsertOne("forms", LeadsObject);
    await InsertOne("forms", AccountObject);
    await InsertOne("forms", CallsObject);
    await InsertOne("forms", contactObject);
    await InsertOne("forms", taskObject);
    await InsertOne("forms", inventoryObject);
    await InsertOne("forms", opportunitiesObject);
    await InsertOne("forms", meetingObject);
    await InsertOne("forms", noteObject);
    await InsertOne("forms", quotesObject);
    await InsertOne("forms", invoiceObject);
    await InsertOne("forms", salesOrderObject);
    await InsertOne("forms", siteVisitObject);
    await InsertOne("forms", vendorObject);
    await InsertOne("forms", channelPartnerObject);

    //-------<END>-------- DUMMY DATA JSON READ AND COVERT IN TO PARSE AFTER INSERT  -------------------
    const obj = {
      res,
      msg: Constant.INFO_MSGS.CREATED_SUCCESSFULLY,
      status: Constant.STATUS_CODE.OK,
      // data: "Successfully Forms Created",
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

/**
 * Sample Form/Data Delete
 */
const sampleDataDelete = async (req, res) => {
  const { logger } = req;
  try {
    const { userId, organizationId } = req.decoded;
    //console.log("userId", userId);
    //console.log("organizationId", organizationId);
    // Delete Dummy Form Using sampleData/OwnerId/organizationId Key

    // All Sample Forms Delete
    await DeleteMany("forms", {
      //sampleData: true,
      FormsOwnerId: new ObjectId(userId),
      organizationId: new ObjectId(organizationId),
    });

    // All Sample DATA Delete new save
    await DeleteMany("accounts", {
      //sampleData: true,
      AccountsOwnerId: new ObjectId(userId),
      organizationId: new ObjectId(organizationId),
    });

    await DeleteMany("calls", {
      //sampleData: true,
      CallsOwnerId: new ObjectId(userId),
      organizationId: new ObjectId(organizationId),
    });

    await DeleteMany("contacts", {
      //sampleData: true,
      ContactsOwnerId: new ObjectId(userId),
      organizationId: new ObjectId(organizationId),
    });

    await DeleteMany("leads", {
      //sampleData: true,
      LeadsOwnerId: new ObjectId(userId),
      organizationId: new ObjectId(organizationId),
    });

    await DeleteMany("meetings", {
      //sampleData: true,
      meetingHostId: new ObjectId(userId),
      organizationId: new ObjectId(organizationId),
    });

    await DeleteMany("tasks", {
      //sampleData: true,
      TasksOwnerId: new ObjectId(userId),
      organizationId: new ObjectId(organizationId),
    });

    await DeleteMany("whatsapp", {
      //sampleData: true,
      WhatsappsOwnerId: new ObjectId(userId),
      organizationId: new ObjectId(organizationId),
    });

    await DeleteMany("email", {
      //sampleData: true,
      EmailsOwnerId: new ObjectId(userId),
      organizationId: new ObjectId(organizationId),
    });

    const obj = {
      res,
      msg: Constant.INFO_MSGS.DELETE_SUCCESSFULLY,
      status: Constant.STATUS_CODE.OK,
    };
    return Response.success(obj);
  } catch (error) {
    //console.log("error", error);
    return handleException(logger, res, error);
  }
};

const createDemoFormByID = (logger, payload) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { userId, organizationId, industry } = payload;
      console.log("organizationId", payload);
      console.log(payload);
      const indystry = industry;
      if (!indystry) {
        indystry == "coworking";
      }

      //Leads Form Add
      const LeadsObject = {};
      if (indystry == "coworking") {
        const LeadsData = fs.readFileSync(
          path.join(__dirname, "../../Demo-form/coworking/lead.json"),
          "utf-8"
        );
        const LeadsParsedata = JSON.parse(LeadsData);
        Object.assign(LeadsObject, LeadsParsedata);
        LeadsObject["FormsOwnerId"] = new ObjectId(userId);
        LeadsObject["CreatedBy"] = new ObjectId(userId);
        LeadsObject["organizationId"] = new ObjectId(organizationId);
        LeadsObject["createdTime"] = new Date();
        LeadsObject["updatedTime"] = new Date();
      } else {
        const LeadsData = fs.readFileSync(
          path.join(__dirname, "../../Demo-form/broker/lead.json"),
          "utf-8"
        );
        const LeadsParsedata = JSON.parse(LeadsData);
        Object.assign(LeadsObject, LeadsParsedata);
        LeadsObject["FormsOwnerId"] = new ObjectId(userId);
        LeadsObject["CreatedBy"] = new ObjectId(userId);
        LeadsObject["organizationId"] = new ObjectId(organizationId);
        LeadsObject["createdTime"] = new Date();
        LeadsObject["updatedTime"] = new Date();
      }

      //Account Form Add
      const AccountObject = {};
      if (indystry == "coworking") {
        const AccountData = fs.readFileSync(
          path.join(__dirname, "../../Demo-form/coworking/account.json"),
          "utf-8"
        );
        const AccountParsedata = JSON.parse(AccountData);
        Object.assign(AccountObject, AccountParsedata);
        AccountObject["FormsOwnerId"] = new ObjectId(userId);
        AccountObject["CreatedBy"] = new ObjectId(userId);
        AccountObject["organizationId"] = new ObjectId(organizationId);
        AccountObject["createdTime"] = new Date();
        AccountObject["updatedTime"] = new Date();
      } else {
        const AccountData = fs.readFileSync(
          path.join(__dirname, "../../Demo-form/broker/account.json"),
          "utf-8"
        );
        const AccountParsedata = JSON.parse(AccountData);
        Object.assign(AccountObject, AccountParsedata);
        AccountObject["FormsOwnerId"] = new ObjectId(userId);
        AccountObject["CreatedBy"] = new ObjectId(userId);
        AccountObject["organizationId"] = new ObjectId(organizationId);
        AccountObject["createdTime"] = new Date();
        AccountObject["updatedTime"] = new Date();
      }

      //contact Form Add
      const contactObject = {};
      if (indystry == "coworking") {
        const contactData = fs.readFileSync(
          path.join(__dirname, "../../Demo-form/coworking/contact.json"),
          "utf-8"
        );
        const contactParsedata = JSON.parse(contactData);
        Object.assign(contactObject, contactParsedata);
        contactObject["FormsOwnerId"] = new ObjectId(userId);
        contactObject["CreatedBy"] = new ObjectId(userId);
        contactObject["organizationId"] = new ObjectId(organizationId);
        contactObject["createdTime"] = new Date();
        contactObject["updatedTime"] = new Date();
      } else {
        const contactData = fs.readFileSync(
          path.join(__dirname, "../../Demo-form/broker/contact.json"),
          "utf-8"
        );
        const contactParsedata = JSON.parse(contactData);
        Object.assign(contactObject, contactParsedata);
        contactObject["FormsOwnerId"] = new ObjectId(userId);
        contactObject["CreatedBy"] = new ObjectId(userId);
        contactObject["organizationId"] = new ObjectId(organizationId);
        contactObject["createdTime"] = new Date();
        contactObject["updatedTime"] = new Date();
      }

      //task Form Add
      const taskObject = {};
      if (indystry == "coworking") {
        const taskData = fs.readFileSync(
          path.join(__dirname, "../../Demo-form/coworking/task.json"),
          "utf-8"
        );
        const taskParsedata = JSON.parse(taskData);
        Object.assign(taskObject, taskParsedata);
        taskObject["FormsOwnerId"] = new ObjectId(userId);
        taskObject["CreatedBy"] = new ObjectId(userId);
        taskObject["organizationId"] = new ObjectId(organizationId);
        taskObject["createdTime"] = new Date();
        taskObject["updatedTime"] = new Date();
      } else {
        const taskData = fs.readFileSync(
          path.join(__dirname, "../../Demo-form/broker/task.json"),
          "utf-8"
        );
        const taskParsedata = JSON.parse(taskData);
        Object.assign(taskObject, taskParsedata);
        taskObject["FormsOwnerId"] = new ObjectId(userId);
        taskObject["CreatedBy"] = new ObjectId(userId);
        taskObject["organizationId"] = new ObjectId(organizationId);
        taskObject["createdTime"] = new Date();
        taskObject["updatedTime"] = new Date();
      }

      //task Form opportunities
      const opportunitiesObject = {};
      if (indystry == "coworking") {
        const opportunitiesData = fs.readFileSync(
          path.join(__dirname, "../../Demo-form/coworking/opportunities.json"),
          "utf-8"
        );
        const opportunitiesParsedata = JSON.parse(opportunitiesData);
        Object.assign(opportunitiesObject, opportunitiesParsedata);
        opportunitiesObject["FormsOwnerId"] = new ObjectId(userId);
        opportunitiesObject["CreatedBy"] = new ObjectId(userId);
        opportunitiesObject["organizationId"] = new ObjectId(organizationId);
        opportunitiesObject["createdTime"] = new Date();
        opportunitiesObject["updatedTime"] = new Date();
      } else {
        const opportunitiesData = fs.readFileSync(
          path.join(__dirname, "../../Demo-form/broker/opportunities.json"),
          "utf-8"
        );
        const opportunitiesParsedata = JSON.parse(opportunitiesData);
        Object.assign(opportunitiesObject, opportunitiesParsedata);
        opportunitiesObject["FormsOwnerId"] = new ObjectId(userId);
        opportunitiesObject["CreatedBy"] = new ObjectId(userId);
        opportunitiesObject["organizationId"] = new ObjectId(organizationId);
        opportunitiesObject["createdTime"] = new Date();
        opportunitiesObject["updatedTime"] = new Date();
      }

      //task Form inventory
      const inventoryObject = {};
      if (indystry == "coworking") {
        const inventoryData = fs.readFileSync(
          path.join(__dirname, "../../Demo-form/coworking/inventory.json"),
          "utf-8"
        );
        const inventoryParsedata = JSON.parse(inventoryData);
        Object.assign(inventoryObject, inventoryParsedata);
        inventoryObject["FormsOwnerId"] = new ObjectId(userId);
        inventoryObject["CreatedBy"] = new ObjectId(userId);
        inventoryObject["organizationId"] = new ObjectId(organizationId);
        inventoryObject["createdTime"] = new Date();
        inventoryObject["updatedTime"] = new Date();
      } else {
        const inventoryData = fs.readFileSync(
          path.join(__dirname, "../../Demo-form/broker/inventory.json"),
          "utf-8"
        );
        const inventoryParsedata = JSON.parse(inventoryData);
        Object.assign(inventoryObject, inventoryParsedata);
        inventoryObject["FormsOwnerId"] = new ObjectId(userId);
        inventoryObject["CreatedBy"] = new ObjectId(userId);
        inventoryObject["organizationId"] = new ObjectId(organizationId);
        inventoryObject["createdTime"] = new Date();
        inventoryObject["updatedTime"] = new Date();
      }

      //Call Form Add
      const CallsObject = {};
      if (indystry == "coworking") {
        const CallsData = fs.readFileSync(
          path.join(__dirname, "../../Demo-form/coworking/call.json"),
          "utf-8"
        );
        const CallsParsedata = JSON.parse(CallsData);
        Object.assign(CallsObject, CallsParsedata);
        CallsObject["FormsOwnerId"] = new ObjectId(userId);
        CallsObject["CreatedBy"] = new ObjectId(userId);
        CallsObject["organizationId"] = new ObjectId(organizationId);
        CallsObject["createdTime"] = new Date();
        CallsObject["updatedTime"] = new Date();
      } else {
        const CallsData = fs.readFileSync(
          path.join(__dirname, "../../Demo-form/broker/call.json"),
          "utf-8"
        );
        const CallsParsedata = JSON.parse(CallsData);
        Object.assign(CallsObject, CallsParsedata);
        CallsObject["FormsOwnerId"] = new ObjectId(userId);
        CallsObject["CreatedBy"] = new ObjectId(userId);
        CallsObject["organizationId"] = new ObjectId(organizationId);
        CallsObject["createdTime"] = new Date();
        CallsObject["updatedTime"] = new Date();
      }

      //email Form Add
      const meetingObject = {};
      if (indystry == "coworking") {
        const meetingData = fs.readFileSync(
          path.join(__dirname, "../../Demo-form/coworking/meeting.json"),
          "utf-8"
        );
        const meetingParsedata = JSON.parse(meetingData);
        Object.assign(meetingObject, meetingParsedata);
        meetingObject["FormsOwnerId"] = new ObjectId(userId);
        meetingObject["CreatedBy"] = new ObjectId(userId);
        meetingObject["organizationId"] = new ObjectId(organizationId);
        meetingObject["createdTime"] = new Date();
        meetingObject["updatedTime"] = new Date();
      } else {
        const meetingData = fs.readFileSync(
          path.join(__dirname, "../../Demo-form/broker/meeting.json"),
          "utf-8"
        );
        const meetingParsedata = JSON.parse(meetingData);
        Object.assign(meetingObject, meetingParsedata);
        meetingObject["FormsOwnerId"] = new ObjectId(userId);
        meetingObject["CreatedBy"] = new ObjectId(userId);
        meetingObject["organizationId"] = new ObjectId(organizationId);
        meetingObject["createdTime"] = new Date();
        meetingObject["updatedTime"] = new Date();
      }

      //note Form Add
      const noteObject = {};
      if (indystry == "coworking") {
        const noteData = fs.readFileSync(
          path.join(__dirname, "../../Demo-form/coworking/note.json"),
          "utf-8"
        );
        const noteParsedata = JSON.parse(noteData);
        Object.assign(noteObject, noteParsedata);
        noteObject["FormsOwnerId"] = new ObjectId(userId);
        noteObject["CreatedBy"] = new ObjectId(userId);
        noteObject["organizationId"] = new ObjectId(organizationId);
        noteObject["createdTime"] = new Date();
        noteObject["updatedTime"] = new Date();
      } else {
        const noteData = fs.readFileSync(
          path.join(__dirname, "../../Demo-form/broker/note.json"),
          "utf-8"
        );
        const noteParsedata = JSON.parse(noteData);
        Object.assign(noteObject, noteParsedata);
        noteObject["FormsOwnerId"] = new ObjectId(userId);
        noteObject["CreatedBy"] = new ObjectId(userId);
        noteObject["organizationId"] = new ObjectId(organizationId);
        noteObject["createdTime"] = new Date();
        noteObject["updatedTime"] = new Date();
      }

      //quotes Form Add
      const quotesObject = {};
      if (indystry == "coworking") {
        const quotesData = fs.readFileSync(
          path.join(__dirname, "../../Demo-form/coworking/quotes.json"),
          "utf-8"
        );
        const quotesParsedata = JSON.parse(quotesData);
        Object.assign(quotesObject, quotesParsedata);
        quotesObject["FormsOwnerId"] = new ObjectId(userId);
        quotesObject["CreatedBy"] = new ObjectId(userId);
        quotesObject["organizationId"] = new ObjectId(organizationId);
        quotesObject["createdTime"] = new Date();
        quotesObject["updatedTime"] = new Date();
      } else {
        const quotesData = fs.readFileSync(
          path.join(__dirname, "../../Demo-form/broker/quotes.json"),
          "utf-8"
        );
        const quotesParsedata = JSON.parse(quotesData);
        Object.assign(quotesObject, quotesParsedata);
        quotesObject["FormsOwnerId"] = new ObjectId(userId);
        quotesObject["CreatedBy"] = new ObjectId(userId);
        quotesObject["organizationId"] = new ObjectId(organizationId);
        quotesObject["createdTime"] = new Date();
        quotesObject["updatedTime"] = new Date();
      }

      //Sales Form Add
      const salesOrderObject = {};
      if (indystry == "coworking") {
        const salesOrderData = fs.readFileSync(
          path.join(__dirname, "../../Demo-form/coworking/salesOrder.json"),
          "utf-8"
        );
        const salesOrderParsedata = JSON.parse(salesOrderData);
        Object.assign(salesOrderObject, salesOrderParsedata);
        salesOrderObject["FormsOwnerId"] = new ObjectId(userId);
        salesOrderObject["CreatedBy"] = new ObjectId(userId);
        salesOrderObject["organizationId"] = new ObjectId(organizationId);
        salesOrderObject["createdTime"] = new Date();
        salesOrderObject["updatedTime"] = new Date();
      } else {
        const salesOrderData = fs.readFileSync(
          path.join(__dirname, "../../Demo-form/broker/salesOrder.json"),
          "utf-8"
        );
        const salesOrderParsedata = JSON.parse(salesOrderData);
        Object.assign(salesOrderObject, salesOrderParsedata);
        salesOrderObject["FormsOwnerId"] = new ObjectId(userId);
        salesOrderObject["CreatedBy"] = new ObjectId(userId);
        salesOrderObject["organizationId"] = new ObjectId(organizationId);
        salesOrderObject["createdTime"] = new Date();
        salesOrderObject["updatedTime"] = new Date();
      }

      //quotes Form Add
      const invoiceObject = {};
      if (indystry == "coworking") {
        const invoiceData = fs.readFileSync(
          path.join(__dirname, "../../Demo-form/coworking/invoice.json"),
          "utf-8"
        );
        const invoiceParsedata = JSON.parse(invoiceData);
        Object.assign(invoiceObject, invoiceParsedata);
        invoiceObject["FormsOwnerId"] = new ObjectId(userId);
        invoiceObject["CreatedBy"] = new ObjectId(userId);
        invoiceObject["organizationId"] = new ObjectId(organizationId);
        invoiceObject["createdTime"] = new Date();
        invoiceObject["updatedTime"] = new Date();
      } else {
        const invoiceData = fs.readFileSync(
          path.join(__dirname, "../../Demo-form/broker/invoice.json"),
          "utf-8"
        );
        const invoiceParsedata = JSON.parse(invoiceData);
        Object.assign(invoiceObject, invoiceParsedata);
        invoiceObject["FormsOwnerId"] = new ObjectId(userId);
        invoiceObject["CreatedBy"] = new ObjectId(userId);
        invoiceObject["organizationId"] = new ObjectId(organizationId);
        invoiceObject["createdTime"] = new Date();
        invoiceObject["updatedTime"] = new Date();
      }

      //siteVisit Form Add
      const siteVisitObject = {};
      if (indystry == "coworking") {
        const siteVisitData = fs.readFileSync(
          path.join(__dirname, "../../Demo-form/coworking/siteVisit.json"),
          "utf-8"
        );
        const siteVisitParsedata = JSON.parse(siteVisitData);
        Object.assign(siteVisitObject, siteVisitParsedata);
        siteVisitObject["FormsOwnerId"] = new ObjectId(userId);
        siteVisitObject["CreatedBy"] = new ObjectId(userId);
        siteVisitObject["organizationId"] = new ObjectId(organizationId);
        siteVisitObject["createdTime"] = new Date();
        siteVisitObject["updatedTime"] = new Date();
      } else {
        const siteVisitData = fs.readFileSync(
          path.join(__dirname, "../../Demo-form/broker/siteVisit.json"),
          "utf-8"
        );
        const siteVisitParsedata = JSON.parse(siteVisitData);
        Object.assign(siteVisitObject, siteVisitParsedata);
        siteVisitObject["FormsOwnerId"] = new ObjectId(userId);
        siteVisitObject["CreatedBy"] = new ObjectId(userId);
        siteVisitObject["organizationId"] = new ObjectId(organizationId);
        siteVisitObject["createdTime"] = new Date();
        siteVisitObject["updatedTime"] = new Date();
      }

      //vendor Form Add
      const vendorObject = {};
      if (indystry == "coworking") {
        const vendorData = fs.readFileSync(
          path.join(__dirname, "../../Demo-form/coworking/vendor.json"),
          "utf-8"
        );
        const vendorParsedata = JSON.parse(vendorData);
        Object.assign(vendorObject, vendorParsedata);
        vendorObject["FormsOwnerId"] = new ObjectId(userId);
        vendorObject["CreatedBy"] = new ObjectId(userId);
        vendorObject["organizationId"] = new ObjectId(organizationId);
        vendorObject["createdTime"] = new Date();
        vendorObject["updatedTime"] = new Date();
      } else {
        const vendorData = fs.readFileSync(
          path.join(__dirname, "../../Demo-form/broker/vendor.json"),
          "utf-8"
        );
        const vendorParsedata = JSON.parse(vendorData);
        Object.assign(vendorObject, vendorParsedata);
        vendorObject["FormsOwnerId"] = new ObjectId(userId);
        vendorObject["CreatedBy"] = new ObjectId(userId);
        vendorObject["organizationId"] = new ObjectId(organizationId);
        vendorObject["createdTime"] = new Date();
        vendorObject["updatedTime"] = new Date();
      }

      //vendor Form Add
      const channelPartnerObject = {};
      if (indystry == "coworking") {
        const channelPartnerData = fs.readFileSync(
          path.join(__dirname, "../../Demo-form/coworking/channelPartner.json"),
          "utf-8"
        );
        const channelPartnerParsedata = JSON.parse(channelPartnerData);
        Object.assign(channelPartnerObject, channelPartnerParsedata);
        channelPartnerObject["FormsOwnerId"] = new ObjectId(userId);
        channelPartnerObject["CreatedBy"] = new ObjectId(userId);
        channelPartnerObject["organizationId"] = new ObjectId(organizationId);
        channelPartnerObject["createdTime"] = new Date();
        channelPartnerObject["updatedTime"] = new Date();
      } else {
        const channelPartnerData = fs.readFileSync(
          path.join(__dirname, "../../Demo-form/broker/channelPartner.json"),
          "utf-8"
        );
        const channelPartnerParsedata = JSON.parse(channelPartnerData);
        Object.assign(channelPartnerObject, channelPartnerParsedata);
        channelPartnerObject["FormsOwnerId"] = new ObjectId(userId);
        channelPartnerObject["CreatedBy"] = new ObjectId(userId);
        channelPartnerObject["organizationId"] = new ObjectId(organizationId);
        channelPartnerObject["createdTime"] = new Date();
        channelPartnerObject["updatedTime"] = new Date();
      }

      // Create Form
      await InsertOne("forms", LeadsObject);
      await InsertOne("forms", AccountObject);
      await InsertOne("forms", CallsObject);
      await InsertOne("forms", contactObject);
      await InsertOne("forms", taskObject);
      await InsertOne("forms", inventoryObject);
      await InsertOne("forms", opportunitiesObject);
      await InsertOne("forms", meetingObject);
      await InsertOne("forms", noteObject);
      await InsertOne("forms", quotesObject);
      await InsertOne("forms", invoiceObject);
      await InsertOne("forms", salesOrderObject);
      await InsertOne("forms", siteVisitObject);
      await InsertOne("forms", vendorObject);
      await InsertOne("forms", channelPartnerObject);
      resolve();
    } catch (error) {
      logger.error(`Error in createDemoFormByID ${error}`);
      reject(error);
    }
  });
};

module.exports = {
  createDemoForm,
  sampleDataDelete,
  createDemoFormByID,
};
