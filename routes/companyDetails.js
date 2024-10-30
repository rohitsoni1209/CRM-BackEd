const express = require('express');
const router = express.Router();
const companyDetails = require('../controller/settings/companyDetailController');
const { auth } = require('../middlewares/auth');

router.use(auth);
router.get('/get-all-company-details', companyDetails.getCompanyDetails);
router.get('/get-company-details-by-id', companyDetails.getCompanyDetailsById);
router.patch('/company-details-update/:id', companyDetails.updateCompanyDetails);
router.patch('/active-inactive-service', companyDetails.ActiveInactiveService);


module.exports = router;