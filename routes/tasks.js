const express = require('express');
const router = express.Router();
const tasks = require('../controller/tasks/tasksController');
const { auth } = require('../middlewares/auth');
const { InstantActions,ApprovalProcess } = require('../middlewares/automation');


router.use(auth);
router.post('/tasks',InstantActions,ApprovalProcess, tasks.createTask);
router.post('/search-tasks', tasks.getTask);
router.get('/tasks-get-by-id/:id', tasks.getTaskById);
router.patch('/tasks/:id',InstantActions,ApprovalProcess, tasks.updateTask);
router.get('/get-tasks-filter-field', tasks.getFilterField);
router.get('/tasks-by-connection/:connectionId', tasks.getTaskByConnId);
router.post('/tasks-mass-transfer', tasks.massTransfer);
router.delete('/tasks-mass-delete', tasks.massDelete)
router.patch('/tasks-mass-update', tasks.massUpdate)


//add Excel File
router.post('/add-tasks-excel', tasks.addTaskExcel);

module.exports = router;