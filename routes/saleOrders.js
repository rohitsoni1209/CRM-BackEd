const express = require("express");
const router = express.Router();
const saleOrder = require("../controller/saleOrders/saleOrdersController");
const { auth } = require("../middlewares/auth");

router.use(auth);
router.post("/sale-orders", saleOrder.createSaleOrder);
router.post("/search-sale-orders", saleOrder.getSaleOrder);
router.get("/sale-orders-get-by-id/:id", saleOrder.getSaleOrderById);
router.patch("/sale-orders/:id", saleOrder.updateSaleOrder);
router.get("/get-sale-orders-filter-field", saleOrder.getFilterField);
router.get(
  "/sale-orders-by-connection/:connectionId",
  saleOrder.getSaleOrderByConnId
);
router.post("/sale-orders-mass-transfer", saleOrder.massTransfer);
router.delete("/sale-orders-mass-delete", saleOrder.massDelete);
router.patch("/sale-orders-mass-update", saleOrder.massUpdate);

//add Excel File
router.post("/add-saleOrder-excel", saleOrder.addSaleOrderExcel);

module.exports = router;
