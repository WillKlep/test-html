//Structure of a washer/dryer object in DB
const mongoose = require("mongoose")

const machineSchema = new mongoose.Schema({
	active: Boolean,
	type: String,
	buildingID: Number,
	machineID: String,
	espID: String,
	UNIXtimeWhenOff: Number,
	UNIXtimeWhenUpdate: Number,
	UNIXcycleTimeRemaining: Number,
	errorCodeList: [String]
});

module.exports = mongoose.model("Machine", machineSchema)