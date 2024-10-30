const express = require('express');
const router = express.Router();
const group = require('../controller/settings/group');
const { auth } = require('../middlewares/auth');

router.use(auth);

router.post('/group', group.createGroup);
router.get('/group', group.getGroup);
router.get('/group-get-by-id/:id', group.getGroupById);
router.patch('/group/:id', group.updateGroup);


module.exports = router;