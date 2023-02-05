const express = require("express");
const router = express.Router();

const washer_controller = require("../controllers/washerController");

//make a dryer one if this actually works

//obtain the home page of the laundry app (localhost/catalog)
router.get("/", washer_controller.index);

//obtain the washer page of the laundry app (localhost/catalog/washer)
//the washer/dryer page will most likely be a single page
router.get("/washers", washer_controller.washer_list);

module.exports = router;