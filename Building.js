//Structure of a building object in DB
const mongoose = require("mongoose")

const buildingSchema = new mongoose.Schema({
	id: Number,
	name: String,
    dryers: [{Object:{dryID: Number, active: Boolean}}],
    washers: [{washID: Number, active: Boolean}]
});


module.exports = mongoose.model("Building", buildingSchema)