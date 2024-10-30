const express = require("express");
const router = express.Router();
const accounts = require("../controller/account/accountController");
const { auth } = require("../middlewares/auth");
const {
  InstantActions,
  ApprovalProcess,
} = require("../middlewares/automation");

router.use(auth);
router.post(
  "/accounts",
  InstantActions,
  ApprovalProcess,
  accounts.createAccount
);
router.post("/search-accounts", accounts.getAccount);
router.get("/accounts-get-by-id/:id", accounts.getAccountById);
router.get("/accounts-get-by-name", accounts.getAccountByName);
router.patch(
  "/accounts/:id",
  InstantActions,
  ApprovalProcess,
  accounts.updateAccount
);
router.get("/get-accounts-filter-field", accounts.getFilterField);
router.post("/account-mass-transfer", accounts.massTransfer);
router.delete("/account-mass-delete", accounts.massDelete);
router.patch("/account-mass-update", accounts.massUpdate);

//add Excel File
router.post("/add-accounts-excel", accounts.addAccountExcel);

module.exports = router;
