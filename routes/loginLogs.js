const express = require("express");
const router = express.Router();
const LoginLog = require("../controller/authentication/loginLogs");
const { auth } = require("../middlewares/auth");

router.use(auth)
router.get("/login-logs", LoginLog.getLoginLogs);

module.exports = router;
