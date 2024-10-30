const express = require("express");
const router = express.Router();
const demoForm = require("../controller/Demo-Form/demoController");
const { auth } = require("../middlewares/auth");

router.use(auth);
router.post("/demo-form", demoForm.createDemoForm);
router.delete("/sample-data-delete", demoForm.sampleDataDelete);

module.exports = router;
