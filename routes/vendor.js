const express = require('express');
const router = express.Router();
const vendor = require('../controller/vendor/vendorController');
const { auth } = require('../middlewares/auth');
const { InstantActions,ApprovalProcess, } = require('../middlewares/automation');

router.use(auth);
router.post('/vendor',InstantActions,ApprovalProcess, vendor.createVendor);
router.post('/search-vendor', vendor.getVendor);
router.get('/vendor-get-by-id/:id', vendor.getVendorById);
router.patch('/vendor/:id',InstantActions,ApprovalProcess, vendor.updateVendor);
router.get('/get-vendor-filter-field', vendor.getFilterField);
router.get('/vendor-by-connection/:connectionId', vendor.getVendorByConnId);
router.post('/vendor-mass-transfer', vendor.massTransfer);
router.delete('/vendor-mass-delete', vendor.massDelete)
router.patch('/vendor-mass-update', vendor.massUpdate)


//add Excel File
router.post('/add-vendor-excel', vendor.addVendorExcel);

module.exports = router;