//Structure of esp
const mongoose = require("mongoose")

const espSchema = new mongoose.Schema({
	dataArray: [],
    uniqueID: String,
    count: Number,
    latestCurrent: Number
});

module.exports = mongoose.model("espDataCollect", espSchema)