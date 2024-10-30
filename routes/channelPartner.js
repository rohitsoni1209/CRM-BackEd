const express = require('express');
const router = express.Router();
const channelPartner = require('../controller/channelPartner/channelPartnerController');
const { auth } = require('../middlewares/auth');
const { InstantActions,ApprovalProcess, } = require('../middlewares/automation');

router.use(auth);
router.post('/channel-partner',InstantActions,ApprovalProcess, channelPartner.createchannelPartner);
router.post('/search-channel-partner', channelPartner.getchannelPartner);
router.get('/channel-partner-get-by-id/:id', channelPartner.getchannelPartnerById);
router.patch('/channel-partner/:id',InstantActions,ApprovalProcess, channelPartner.updatechannelPartner);
router.get('/get-channel-partner-filter-field', channelPartner.getFilterField);
router.get('/channel-partner-by-connection/:connectionId', channelPartner.getchannelPartnerByConnId);
router.post('/channel-partner-mass-transfer', channelPartner.massTransfer);
router.delete('/channel-partner-mass-delete', channelPartner.massDelete)
router.patch('/channel-partner-mass-update', channelPartner.massUpdate)

//add Excel File
router.post('/add-channel-partner-excel', channelPartner.addchannelPartnerExcel);

module.exports = router;