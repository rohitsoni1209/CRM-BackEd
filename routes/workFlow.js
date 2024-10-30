const express = require("express");
const router = express.Router();
const workFlow = require("../controller/settings/automation/workFlowController");
const { auth } = require("../middlewares/auth");

router.use(auth);
router.post("/workflow", workFlow.createWorkFlow);
router.post("/search-workflow", workFlow.getWorkFlow);
router.get("/workflow-get-by-id/:id", workFlow.getWorkFlowById);
router.patch("/workflow/:id", workFlow.updateWorkFlow);
router.get("/get-workflow-filter-field", workFlow.getFilterField);
router.post("/workflow-mass-transfer", workFlow.massTransfer);
router.delete("/workflow-mass-delete", workFlow.massDelete);
router.patch("/workflow-mass-update", workFlow.massUpdate);

//add Excel File
router.post("/add-workflow-excel", workFlow.addWorkFlowExcel);

module.exports = router;
