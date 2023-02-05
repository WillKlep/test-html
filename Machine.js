//Structure of a washer/dryer object in DB
const mongoose = require("mongoose")

const machineSchema = new mongoose.Schema({
	state: String,
	type: String
});

module.exports = mongoose.model("Machine", machineSchema)