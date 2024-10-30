const express = require("express");
const router = express.Router();
const forms = require("../controller/settings/formController");
const { auth } = require("../middlewares/auth");

router.use(auth);
router.post("/forms", forms.createForm);
router.get("/forms", forms.getForm);
router.get("/forms-group", forms.getFormGroup);
router.get("/forms-get-by-id/:id", forms.getFormById);
router.get("/forms-get-by-title/:formTitle", forms.getByFormName);
router.get("/forms-get-by-titleall/alldata", forms.getByAllFormName);
router.patch("/forms/:id", forms.updateForm);

module.exports = router;
