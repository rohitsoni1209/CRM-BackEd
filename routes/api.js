const express = require('express');
const router = express.Router();
const api = require('../controller/profile/api');
const { auth } = require('../middlewares/auth');

router.use(auth);
router.post('/api', api.createApiKey);
router.get('/api', api.getApiKey);
router.get('/download-data', api.downloadAllDBdata);
router.get('/get-download-data', api.getdownloadDataLink);


module.exports = router;