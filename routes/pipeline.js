const express = require("express");
const router = express.Router();
const pipeline = require("../controller/settings/customization/pipeline");
const { auth } = require("../middlewares/auth");
const { InstantActions } = require("../middlewares/automation");

router.use(auth);
router.post("/pipeline", pipeline.createPipeline);
router.post("/search-pipeline", pipeline.getPipeline);
router.get("/pipeline-get-by-id/:id", pipeline.getPipelineById);
router.patch("/pipeline/:id", pipeline.updatePipeline);
router.delete("/pipeline-delete-by-id/:id", pipeline.deletePipeline);
router.get("/get-pipeline-filter-field", pipeline.getFilterField);

//pipeline-Stages
router.post("/stage", pipeline.createStage);
router.post("/search-stage", pipeline.getStage);

module.exports = router;
