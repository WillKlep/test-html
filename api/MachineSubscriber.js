//Structure of a machineSubscriber object in DB
const mongoose = require("mongoose");

const machineSubscriberSchema = new mongoose.Schema({
	subbedMachines: [String],
	subObj: Object
});


module.exports = mongoose.model("MachineSubscriber", machineSubscriberSchema)