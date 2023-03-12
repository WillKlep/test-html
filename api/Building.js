//Structure of a building object in DB
const mongoose = require("mongoose")

/*
var washerObj = {
    washID: Number,
    active: Boolean,
    subscribers: [Object]
};
*/
const buildingSchema = new mongoose.Schema({
	name: String,
    buildingID: Number
    //dryers: [{Object:{dryID: Number, active: Boolean}}],
    //washers: [washerObj]
});


module.exports = mongoose.model("Building", buildingSchema)