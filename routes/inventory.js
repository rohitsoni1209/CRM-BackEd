const express = require('express');
const router = express.Router();
const inventory = require('../controller/inventory/inventoryController');
const { auth } = require('../middlewares/auth');
const { InstantActions,ApprovalProcess } = require('../middlewares/automation');


router.use(auth);
router.post('/inventory',InstantActions,ApprovalProcess, inventory.createInventory);
router.post('/search-inventory', inventory.getInventory);
router.get('/inventory-get-by-id/:id', inventory.getInventoryById);
router.get('/inventory-by-connection/:connectionId', inventory.getInventoryByConnId);
router.patch('/inventory/:id',InstantActions,ApprovalProcess, inventory.updateInventory);
router.get('/get-inventory-filter-field', inventory.getFilterField);
router.post('/inventory-mass-transfer', inventory.massTransfer);
router.delete('/inventory-mass-delete', inventory.massDelete)
router.patch('/inventory-mass-update', inventory.massUpdate)


//add Excel File
router.post('/add-inventory-excel', inventory.addInventoryExcel);


module.exports = router;