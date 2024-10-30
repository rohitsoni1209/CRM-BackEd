const express = require('express');
const router = express.Router();
const reportController = require('../controller/Report/reportController');
const { auth } = require('../middlewares/auth');

router.use(auth);
router.get('/report/modules', reportController.getModules);
router.post('/report/folder', reportController.createReportFolder);
router.put('/report/folder', reportController.renameReportFolder);
router.delete('/report/folder', reportController.deleteFolder);
router.get('/report/all', reportController.getAllReports);
router.post('/report', reportController.createReport);
router.put('/report', reportController.editReport);
router.delete('/report', reportController.deleteReport);
router.get('/report/folder', reportController.getFolderAndReport);
router.get('/report/generate', reportController.generateReport);

module.exports = router;