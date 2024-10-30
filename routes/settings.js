const express = require("express");
const router = express.Router();
const convert = require("../controller/settings/convertController");
const connection = require("../controller/settings/connectionController");
const checkpermission = require("../controller/settings/checkpermission");
const kanbanView = require("../controller/settings/kanbanView");
const canvasView = require("../controller/settings/canvasView");
const auditLog = require("../controller/settings/auditLog");
const { auth } = require("../middlewares/auth");

router.use(auth);

//convert
router.post("/convert", convert.convertDataLeadToOther);
router.post("/update-tuch", convert.updateTuch);

router.get(
  "/get-time-line-by-connection-id/:id",
  connection.getTimeLineByConnectionId
);

//auditLog
router.get("/get-audit-log", auditLog.getAuditLog);

function test() {
  console.log("test");
  return true;
}
//checkPermission
router.get("/check-permission", checkpermission.checkpermission);

//kanban View
router.post("/kanban-view", kanbanView.createKanbanView);
router.get("/get-kanban-view", kanbanView.getKanbanView);
router.get("/filtered-kanban-view", kanbanView.FilteredKanbanView);

//canvas View
router.post("/canvas-view", canvasView.AddCanvasView);
router.get("/get-canvas-view", canvasView.GetCanvasView);
router.get("/get-canvas-view-by-id/:id", canvasView.getCanvasViewById);
router.patch("/update-canvas-view/:id", canvasView.UpdateCanvasView);

module.exports = router;
