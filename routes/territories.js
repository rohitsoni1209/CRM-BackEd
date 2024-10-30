const express = require('express');
const router = express.Router();
const territories = require('../controller/settings/territories');
const { auth } = require('../middlewares/auth');

router.use(auth);

router.post('/territories', territories.createTerritories);
router.get('/territories', territories.getTerritories);
router.get('/territories/:id', territories.getTerritoriesDetails);
router.patch('/territories/:id', territories.updateTerritories);
router.delete('/territories/:id', territories.deleteTerritories);

router.patch('/territories/run/:id', territories.runTerritories);


module.exports = router;