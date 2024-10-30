const express = require('express');
const router = express.Router();
const contacts = require('../controller/contacts/contactsController');
const { auth } = require('../middlewares/auth');
const { InstantActions,ApprovalProcess } = require('../middlewares/automation');


router.use(auth);
router.post('/contacts',InstantActions,ApprovalProcess, contacts.createContacts);
router.post('/search-contacts', contacts.getContacts);
router.get('/contacts-get-by-id/:id', contacts.getContactsById);
router.patch('/contacts/:id',InstantActions,ApprovalProcess, contacts.updateContacts);
router.get('/get-contacts-filter-field', contacts.getFilterField);
router.post('/contacts-mass-transfer', contacts.massTransfer);
router.delete('/contacts-mass-delete', contacts.massDelete)
router.patch('/contacts-mass-update', contacts.massUpdate)

//add Excel File
router.post('/add-contacts-excel', contacts.addContactsExcel);



module.exports = router;