const express = require("express");
const router = express.Router();
const calls = require("../controller/calls/callsController");
const Makecalls = require("../controller/settings/makeCallController");
const { auth } = require("../middlewares/auth");
const {
  InstantActions,
  ApprovalProcess,
} = require("../middlewares/automation");

router.use(auth);
router.post("/calls", InstantActions, ApprovalProcess, calls.createCall);
router.post("/search-calls", calls.getCall);
//router.get("/search-calls-date", calls.getFilterFieldDate);
router.get("/calls-get-by-id/:id", calls.getCallById);
router.patch("/calls/:id", InstantActions, ApprovalProcess, calls.updateCall);
router.get("/get-calls-filter-field", calls.getFilterField);
router.get("/calls-by-connection/:connectionId", calls.getCallByConnId);
router.post("/call-mass-transfer", calls.massTransfer);
router.delete("/call-mass-delete", calls.massDelete);
router.patch("/call-mass-update", calls.massUpdate);
router.get("/get-scheduled-call", calls.getScheduledCall);

router.post("/make-call", Makecalls.MakeCall);

//add Excel File
router.post("/add-call-excel", calls.addCallExcel);

module.exports = router;
