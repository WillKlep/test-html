//Structure of a washer/dryer object in DB
const mongoose = require("mongoose")

const machineSchema = new mongoose.Schema({
	state: Boolean,
	type: String,
	buildingID: Number,
	machineID: Number
});

module.exports = mongoose.model("Machine", machineSchema)