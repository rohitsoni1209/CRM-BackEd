const express = require('express');
const router = express.Router();
const leads = require('../controller/leads/leadsController');
const { auth } = require('../middlewares/auth');
const { InstantActions,ApprovalProcess } = require('../middlewares/automation');


router.use(auth);
router.post('/leads',InstantActions,ApprovalProcess, leads.createLeads);
router.post('/search-leads', leads.getLeads);
router.get('/leads-get-by-id/:id', leads.getleadsById);
router.patch('/leads/:id',InstantActions,ApprovalProcess, leads.updateLeads);
router.get('/get-leads-filter-field', leads.getFilterField);
router.get('/leads-by-connection/:connectionId', leads.getLeadsByConnId);
router.post('/leads-mass-transfer', leads.massTransfer);
router.delete('/leads-mass-delete', leads.massDelete)
router.patch('/leads-mass-update', leads.massUpdate)


//add Excel File
router.post('/add-leads-excel', leads.addLeadsExcel);

module.exports = router;