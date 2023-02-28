//Structure of a building object in DB
const mongoose = require("mongoose");

const machineSubscriberSchema = new mongoose.Schema({
	machineid: Number,
	subObj: Object
});


module.exports = mongoose.model("MachineSubscriber", machineSubscriberSchema)
