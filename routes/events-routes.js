const express = require("express")
const router = express.Router();
const eventsController = require("../controllers/event-controller");


router.get("/", eventsController.getAllEvents);
router.post("/", eventsController.addEvent);
router.get("/:id", eventsController.getById);
router.put("/:id", eventsController.updateEvent);
router.delete("/:id", eventsController.deleteEvent);

module.exports = router;