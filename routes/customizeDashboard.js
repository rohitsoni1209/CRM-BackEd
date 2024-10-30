const express = require('express');
const router = express.Router();
const controller = require('../controller/settings/customization/customizeDashboard');
const { auth } = require('../middlewares/auth');

router.use(auth);

router.post('/home-customization', controller.createCustomizeDashboard);
router.get('/home-customization', controller.getCustomizeDashboard);
router.get('/home-customization/:id', controller.getCustomizeDashboardDetails);
router.patch('/home-customization/:id', controller.updateCustomizeDashboard);
router.delete('/home-customization/:id', controller.deleteCustomizeDashboard);


module.exports = router;