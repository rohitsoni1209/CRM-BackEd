const express = require('express');

const router = express.Router();
const user = require('./user');
const leads = require('./leads');
const contacts = require('./contacts');
const account = require('./accounts');
const deals = require('./deals');
const api = require('./api');
const tasks = require('./tasks');
const meetings = require('./meetings');
const calls = require('./calls');
const purchaseOrders = require('./purchaseOrder');
const saleOrders = require('./saleOrders');
const invoices = require('./invoices');
const quotes = require('./quotes');
const form = require('./form');
const view = require('./view');
const companyDetails = require('./companyDetails');
const whatsapp = require('./whatsapp');
const settings = require('./settings');
const siteVisit = require('./siteVisit');
const emailTemplate = require('./emailTemplate');
const smsTemplate = require('./smsTemplate');
const demo = require('./demo');
const group = require('./group');
const loginLogs = require('./loginLogs');
const inventory = require('./inventory');
const notes = require('./notes');
const google = require('./google');
const facebook = require('./facebook');
const googleCalendar = require('./googleCalendar');
const rulePermission = require('./rulePermission');
const ruleSharing = require('./ruleSharing');
const chat = require('./chat');
const macro = require('./macro');
const vendor = require('./vendor');
const workFlow = require('./workFlow');
const autoResponder = require('./autoResponder');
const territories = require('./territories')
const assignmentRule = require('./assignmentRule')
const pipeline = require('./pipeline')
const caseEscalation = require('./caseEscalation')
const approvalProcess = require('./approvalProcess')
const customizeDashboard = require('./customizeDashboard')
const sheet = require('./sheet')
const report = require('./report')
const channelPartner = require('./channelPartner')


router.use('/', user);
router.use('/', leads);
router.use('/', contacts);
router.use('/', account);
router.use('/', deals);
router.use('/', api);
router.use('/', tasks);
router.use('/', meetings);
router.use('/', calls);
router.use('/', saleOrders);
router.use('/', purchaseOrders);
router.use('/', invoices);
router.use('/', quotes);
router.use('/', form);
router.use('/', view);
router.use('/', companyDetails);
router.use('/', whatsapp);
router.use('/', settings);
router.use('/', siteVisit);
router.use('/', smsTemplate);
router.use('/', emailTemplate);
router.use('/', demo);
router.use('/', group);
router.use('/', loginLogs);
router.use('/', notes);
router.use('/', inventory);
router.use('/', google);
router.use('/', facebook);
router.use('/', googleCalendar);
router.use('/', rulePermission);
router.use('/', ruleSharing);
router.use('/', chat)
router.use('/', macro)
router.use('/', vendor)
router.use('/', workFlow)
router.use('/', autoResponder)
router.use('/', territories)
router.use('/', assignmentRule);
router.use('/', pipeline);
router.use('/', caseEscalation);
router.use('/', approvalProcess);
router.use('/', customizeDashboard);
router.use('/', sheet);
router.use('/', report);
router.use('/', channelPartner);



module.exports = router;