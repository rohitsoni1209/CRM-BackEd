const express = require('express');
const router = express.Router();
const rule = require('../controller/settings/ruleSharingController');
const { auth } = require('../middlewares/auth');

router.use(auth);
router.post('/share-rule', rule.createShareRule);
router.get('/get-share-rule', rule.getRuleShare);
router.get('/get-share-rule-by-id/:id', rule.getShareRuleById);
router.patch('/update-share-rule/:id', rule.updateShareRule);
router.delete('/delete-share-rule/:id', rule.deleteShareRule);

module.exports = router;