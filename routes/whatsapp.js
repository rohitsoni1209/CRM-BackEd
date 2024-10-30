const express = require('express');
const router = express.Router();
const whatsapp = require('../controller/whatsapp/whatsappController');
const { auth } = require('../middlewares/auth');

router.use(auth);
router.post('/add-whatsapp-temp', whatsapp.createWhatsapp);
router.post('/search-get-whatsapp-temp', whatsapp.getWhatsapp);
router.get('/whatsapp-get-by-id/:id', whatsapp.getWhatsappById);
router.patch('/update-whatsapp-temp/:id', whatsapp.updateWhatsapp);
router.get('/get-whatsapp-filter-field', whatsapp.getFilterWhatsappField);
router.delete('/delete-whatsapp-temp/:id', whatsapp.deleteWhatsappTemplate);


// Send-Whatsapp routes
router.post("/send-whatsapp", whatsapp.sendWhatsapp);
router.get("/get-sent-whatsapp-by-connection/:connectionId", whatsapp.getSentWhatsappByConnId);
router.get("/get-sent-whatsapp-by-id/:id", whatsapp.getSentWhatsappById);


module.exports = router;