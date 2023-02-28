//Structure of a building object in DB
const mongoose = require("mongoose")

var washerObj = {
    washID: Number,
    active: Boolean,
    subscribers: [Object]
};

const buildingSchema = new mongoose.Schema({
	id: Number,
	name: String,
    dryers: [{Object:{dryID: Number, active: Boolean}}],
    washers: [washerObj]
});


module.exports = mongoose.model("Building", buildingSchema)