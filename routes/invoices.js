const express = require('express');
const router = express.Router();
const invoices = require('../controller/invoices/invoicesController');
const { auth } = require('../middlewares/auth');

router.use(auth);
router.post('/invoices', invoices.createInvoice);
router.post('/search-invoices', invoices.getInvoice);
router.get('/invoices-get-by-id/:id', invoices.getInvoiceById);
router.patch('/invoices/:id', invoices.updateInvoice);
router.get('/get-invoices-filter-field', invoices.getFilterField);
router.get('/invoices-by-connection/:connectionId', invoices.getOrderByConnId);
router.post('/invoices-mass-transfer', invoices.massTransfer);
router.delete('/invoices-mass-delete', invoices.massDelete)
router.patch('/invoices-mass-update', invoices.massUpdate)


//add Excel File
router.post('/add-invoices-excel', invoices.addInvoiceExcel);

module.exports = router;