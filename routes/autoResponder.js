const express = require('express');
const router = express.Router();
const autoresponder = require('../controller/settings/autoresponder');
const { auth } = require('../middlewares/auth');

router.use(auth);
router.post('/autoresponder', autoresponder.createAutoResponder);
router.post('/search-autoresponder', autoresponder.getAutoResponder);
router.get('/autoresponder-get-by-id/:id', autoresponder.getAutoResponderById);
router.patch('/autoresponder/:id', autoresponder.updateAutoResponder);
router.get('/get-autoresponder-filter-field', autoresponder.getFilterField);
router.post('/autoresponder-mass-transfer', autoresponder.massTransfer);
router.delete('/autoresponder-mass-delete', autoresponder.massDelete)
router.patch('/autoresponder-mass-update', autoresponder.massUpdate)

module.exports = router;