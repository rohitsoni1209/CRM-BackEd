const express = require('express');
const router = express.Router();
const macro = require('../controller/settings/macro');
const { auth } = require('../middlewares/auth');

router.use(auth);

router.post('/macro', macro.createMacro);
router.get('/macro', macro.getMacro);
router.get('/macro/:id', macro.getMacroDetails);
router.patch('/macro/:id', macro.updateMacro);
router.delete('/macro/:id', macro.deleteMacro);

router.patch('/macro/run/:id', macro.runMacro);


module.exports = router;