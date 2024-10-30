const express = require("express");
const router = express.Router();
const caseEscalation = require("../controller/settings/automation/caseEscalation");
const { auth } = require("../middlewares/auth");

router.use(auth);
router.post("/caseEscalation", caseEscalation.createCaseEscalation);
router.post("/search-caseEscalation", caseEscalation.getCaseEscalation);
router.get("/caseEscalation-get-by-id/:id", caseEscalation.getCaseEscalationById);
router.patch("/caseEscalation/:id", caseEscalation.updateCaseEscalation);
router.delete("/caseEscalation-delete-by-id/:id", caseEscalation.deleteCaseEscalation);
router.get("/get-caseEscalation-filter-field", caseEscalation.getFilterField);

module.exports = router;
