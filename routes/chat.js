const express = require('express');
const router = express.Router();
const chat = require('../controller/settings/chat');
const { auth } = require('../middlewares/auth');

router.use(auth);
router.get('/check-chat', chat.checkChat);
module.exports = router;