const express = require("express");
const router = express.Router();
const quotes = require("../controller/quotes/quotesController");
const { auth } = require("../middlewares/auth");

router.use(auth);
router.post("/quotes", quotes.createQuote);
router.post("/search-quotes", quotes.getQuote);
router.get("/quotes-get-by-id/:id", quotes.getQuoteById);
router.patch("/quotes/:id", quotes.updateQuote);
router.get("/", quotes.getFilterField);
router.get("/quotes-by-connection/:connectionId", quotes.getQuoteByConnId);
router.post("/quotes-mass-transfer", quotes.massTransfer);
router.get("/get-quotes-filter-field", quotes.getFilterField);
router.delete("/quotes-mass-delete", quotes.massDelete);
router.patch("/quotes-mass-update", quotes.massUpdate);

//add Excel File
router.post("/add-quotes-excel", quotes.addQuotesExcel);

module.exports = router;
