//Structure of a building object in DB
const mongoose = require("mongoose")

const buildingSchema = new mongoose.Schema({
	name: String,
    buildingID: Number

});
  


module.exports = mongoose.model("Building", buildingSchema)