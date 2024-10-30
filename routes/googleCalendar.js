const express = require('express');
const router = express.Router();
const calender = require('../controller/profile/profileController');
const { auth } = require('../middlewares/auth');

router.use(auth);
router.post('/add-google-calendar', calender.addGoogleCalendar);

module.exports = router;