//Structure of a machine object in DB
const mongoose = require("mongoose")


const machineSchema = new mongoose.Schema({
	active: Boolean,
	cycle: String,
	type: String,
	buildingID: Number,
	machineID: String,
	espID: String,
	UNIXtimeWhenOff: Number,
	UNIXtimeWhenOn: Number,
	UNIXtimeWhenUpdate: Number,
	errorCodeList: [String],
	dataArray: []
},{
	toObject: {virtuals:true},
	toJSON: {virtuals:true}
});

//foreign key for buildingID
machineSchema.virtual('building', {
    ref: 'Building',
    localField: 'buildingID',
    foreignField: 'buildingID',
	justOne: true
  });

module.exports = mongoose.model("Machine", machineSchema)