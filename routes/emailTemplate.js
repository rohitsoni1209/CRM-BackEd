const express = require("express");
const router = express.Router();
const email = require("../controller/email/emailController");
const { auth } = require("../middlewares/auth");

router.use(auth);
router.post("/add-email-temp", email.createEmail);
router.post("/search-get-email-temp", email.getEmail);
router.get("/email-get-by-id/:id", email.getEmailById);
router.patch("/update-email-temp/:id", email.updateEmail);
router.get("/get-email-filter-field", email.getFilterEmailField);
router.delete("/delete-email-temp/:id", email.deleteEmailTemplate);

// Send-Email routes
router.post("/send-email", email.sendEmail);
router.get(
  "/get-sent-email-by-connection/:connectionId",
  email.getSentEmailByConnId
);
router.get("/get-sent-email-by-id/:id", email.getSentEmailById);

module.exports = router;
