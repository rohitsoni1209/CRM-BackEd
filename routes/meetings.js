const express = require('express');
const router = express.Router();
const meetings = require('../controller/meeting/meetingController');
const { auth } = require('../middlewares/auth');
const { InstantActions,ApprovalProcess } = require('../middlewares/automation');


router.use(auth);
router.post('/meetings',InstantActions,ApprovalProcess, meetings.createMeeting);
router.post('/search-meetings', meetings.getMeeting);
router.get('/meetings-get-by-id/:id', meetings.getMeetingById);
router.patch('/meetings/:id',InstantActions,ApprovalProcess, meetings.updateMeeting);
router.get('/get-meetings-filter-field', meetings.getFilterField);
router.get('/meetings-by-connection/:connectionId', meetings.getMeetingByConnId);
router.post('/meetings-mass-transfer', meetings.massTransfer);
router.delete('/meetings-mass-delete', meetings.massDelete)
router.patch('/meetings-mass-update', meetings.massUpdate)



//add Excel File
router.post('/add-meetings-excel', meetings.addMeetingExcel);

module.exports = router;