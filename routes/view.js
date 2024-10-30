const express = require('express');
const router = express.Router();
const view = require('../controller/settings/viewController');
const { auth } = require('../middlewares/auth');

router.use(auth);
router.post('/views', view.createView);
router.get('/views', view.getView);
// router.get('/views-get-by-id/:id', forms.getFormById);
router.get('/views-get-by-title/:tableView', view.getByFormName);
router.patch('/views/:id', view.updateView);





module.exports = router;