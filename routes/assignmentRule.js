const express = require("express");
const router = express.Router();
const assignmentRule = require("../controller/settings/automation/assignmentRule");
const { auth } = require("../middlewares/auth");

router.use(auth);
router.post("/assignmentrule", assignmentRule.createAssignmentRule);
router.post("/get-assignmentrule-list", assignmentRule.getAssignmentRule);
router.get(
  "/assignmentrule-get-by-id/:id",
  assignmentRule.getAssignmentRuleById
);
router.delete(
  "/assignmentrule-delete-by-id/:id",
  assignmentRule.getAssignmentRuleDeleteById
);
router.patch("/update-assignmentrule/:id", assignmentRule.updateAssignmentRule);

module.exports = router;
