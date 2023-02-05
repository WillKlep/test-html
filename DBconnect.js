//This is file is used for testing the connection of the database.
//It is never used in the actual website
const mongoose = require("mongoose");
const Machine = require("./Machine");
mongoose.connect("mongodb://127.0.0.1:27017/testdb",
{
	useNewUrlParser: true,
	useUnifiedTopology: true
	
}).then(() => {
	console.log('connected to db');
}).catch((error) => {
	console.log('problem found', error);
});

const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));

getWashers();
console.log("test");

async function getWashers(){
	Machine.find({type: "Washer"}, "state", (err, allWasher) =>{
		if (err) return handleError(err);
		console.log(allWasher);
	});
	
}



//run();
async function run(){
	//const machine = await Machine.create({state: "On", type: "Washer"});
	//const machine = new Machine({state: "On", type: "Washer"})
	await machine.save();
	console.log(machine);
}