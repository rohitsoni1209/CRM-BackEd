const express = require("express");
const router = express.Router();
const sms = require("../controller/sms/smsController");
const { auth } = require("../middlewares/auth");

router.use(auth);
router.post("/add-sms-temp", sms.createSms);
router.post("/search-get-sms-temp", sms.getSms);
router.get("/sms-get-by-id/:id", sms.getSmsById);
router.patch("/update-sms-temp/:id", sms.updateSms);
router.get("/get-sms-filter-field", sms.getFilterSmsField);
router.delete("/delete-sms-temp/:id", sms.deleteSMSTemplate);

// Send-sms routes
router.post("/send-sms", sms.sendSms);
router.get("/get-sent-sms-by-connection/:connectionId", sms.getSentSmsByConnId);
router.get("/get-sent-sms-by-id/:id", sms.getSentSmsById);
// router.get("/get-sent-sms", sms.getSentSms);

module.exports = router;
