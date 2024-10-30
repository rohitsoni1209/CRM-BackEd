const express = require('express');
const router = express.Router();
const rulePermission = require('../controller/settings/rulePermissionController');
const { auth } = require('../middlewares/auth');

router.use(auth);
router.post('/permission-rule', rulePermission.createRulePermission);
router.post('/get-permission-rule', rulePermission.getRulePermission);
router.get('/permission-get-by-id', rulePermission.getRulePermissionById);

module.exports = router;