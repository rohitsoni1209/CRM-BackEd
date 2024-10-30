const express = require("express");
const router = express.Router();
const Notes = require("../controller/notes/notesController");
const { auth } = require("../middlewares/auth");
const {
  InstantActions,
  ApprovalProcess,
} = require("../middlewares/automation");

router.use(auth);
router.post("/notes", InstantActions, ApprovalProcess, Notes.createNotes);
router.post("/search-notes", Notes.getNotes);
router.get("/notes-get-by-id/:id", Notes.getNotesById);
router.get("/notes-by-connection/:connectionId", Notes.getNotesByConnId);
router.patch("/notes/:id", InstantActions, ApprovalProcess, Notes.updateNotes);
router.get("/get-notes-filter-field", Notes.getFilterField);
router.post("/notes-mass-transfer", Notes.massTransfer);
router.delete("/notes-mass-delete", Notes.massDelete);
router.patch("/notes-mass-update", Notes.massUpdate);

//add Excel File
router.post("/add-notes-excel", Notes.addNotesExcel);

module.exports = router;
