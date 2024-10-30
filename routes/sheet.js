const express = require("express");
const router = express.Router();
const Sheet = require("../controller/sheet/sheetController");
const { auth } = require("../middlewares/auth");

router.use(auth);

router.post("/sheet", Sheet.AddSheet);
router.get("/get-sheet", Sheet.GetSheet);
router.get("/get-sheet-by-id/:id", Sheet.getSheetById);

module.exports = router;
