const express = require("express");
const router = express.Router();
const approvalProcess = require("../controller/settings/processManagement/approvalProcess");
const { auth } = require("../middlewares/auth");

router.use(auth);
router.post("/approvalProcess", approvalProcess.createApprovalProcess);
router.post("/search-approvalProcess", approvalProcess.getApprovalProcess);
router.get("/approvalProcess-get-by-id/:id", approvalProcess.getApprovalProcessById);
router.patch("/approvalProcess/:id", approvalProcess.updateApprovalProcess);
router.delete("/approvalProcess-delete-by-id/:id", approvalProcess.deleteApprovalProcess);
router.get("/get-approvalProcess-filter-field", approvalProcess.getFilterField);

module.exports = router;
