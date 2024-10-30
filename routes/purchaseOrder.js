const express = require('express');
const router = express.Router();
const purchaseOrder = require('../controller/purchaseOrders/purchaseOrdersController');
const { auth } = require('../middlewares/auth');

router.use(auth);
router.post('/purchase-orders', purchaseOrder.createPurchaseOrder);
router.post('/search-purchase-orders', purchaseOrder.getPurchaseOrder);
router.get('/purchase-orders-get-by-id/:id', purchaseOrder.getPurchaseOrderById);
router.patch('/purchase-orders/:id', purchaseOrder.updatePurchaseOrder);
router.get('/get-purchase-orders-filter-field', purchaseOrder.getFilterField);
router.get('/purchase-orders-by-connection/:connectionId', purchaseOrder.getPurchaseOrderByConnId);
router.post('/purchase-orders-mass-transfer', purchaseOrder.massTransfer);
router.delete('/purchase-orders-mass-delete', purchaseOrder.massDelete)
router.patch('/purchase-orders-mass-update', purchaseOrder.massUpdate)


//add Excel File
router.post('/add-purchaseOrder-excel', purchaseOrder.addPurchaseOrderExcel);



module.exports = router;