const express = require('express');
const router = express.Router();
const google = require('../controller/platforms/googleController');
const { auth } = require('../middlewares/auth');
router.use(auth);

router.post('/auth', google.createGoogle);
router.post("/google-access_token", google.access_token);
router.get('/credentials/:name', google.GetAuthURLByName);


router.get('/credentials', google.GetAuthURL);            //Using credentials


router.get('/auth-single/:id', google.GetAuthURLByID);
router.get('/credentials-list', google.GetAuthURLList);
router.patch('/google/:id', google.updateGoogle);
router.delete('/google/:id', google.DeleteGoogle);
module.exports = router;