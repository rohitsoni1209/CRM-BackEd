const express = require('express');
const router = express.Router();
const siteVisit = require('../controller/siteVisit/siteVisitController');
const { auth } = require('../middlewares/auth');
const { InstantActions } = require('../middlewares/automation');


router.use(auth);
router.post('/siteVisit',InstantActions, siteVisit.createSiteVisit);
router.post('/search-siteVisit', siteVisit.getSiteVisit);
router.get('/siteVisit-get-by-id/:id', siteVisit.getSiteVisitById);
router.patch('/siteVisit/:id',InstantActions, siteVisit.updateSiteVisit);
router.get('/get-siteVisit-filter-field', siteVisit.getFilterField);
router.get('/siteVisit-by-connection/:connectionId', siteVisit.getSiteVisitByConnId);
router.post('/siteVisit-mass-transfer', siteVisit.massTransfer);
router.delete('/siteVisit-mass-delete', siteVisit.massDelete)
router.patch('/siteVisit-mass-update', siteVisit.massUpdate)



//add Excel File
router.post('/add-siteVisit-excel', siteVisit.addSitevisitExcel);

module.exports = router;