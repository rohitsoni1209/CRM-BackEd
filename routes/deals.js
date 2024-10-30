const express = require('express');
const router = express.Router();
const deals = require('../controller/deal/dealController');
const { auth } = require('../middlewares/auth');
const { InstantActions,ApprovalProcess } = require('../middlewares/automation');


router.use(auth);
router.post('/deals',InstantActions,ApprovalProcess, deals.createDeal);
router.post('/search-deals', deals.getDeal);
router.get('/deals-get-by-id/:id', deals.getDealById);
router.patch('/deals/:id',InstantActions,ApprovalProcess, deals.updateDeal);
router.get('/get-deals-filter-field', deals.getFilterField);
router.post('/deals-mass-transfer', deals.massTransfer);
router.delete('/deals-mass-delete', deals.massDelete)
router.patch('/deals-mass-update', deals.massUpdate)

//add Excel File
router.post('/add-deal-excel', deals.addDealExcel);

//add Deal Inventory
router.post('/deal-inventory', deals.createDealInventory);
router.get('/get-deal-inventory/:DealId', deals.getDealInventory);

module.exports = router;