//This is file is used for testing the connection of the database.
//It is never used in the actual website
const mongoose = require("mongoose");
const Machine = require("./Machine");
const Building = require("./Building");
mongoose.connect("mongodb://0.0.0.0:27017/test1",
{
	// add ssl or tls connect
	tls: true,
	tlsCAFile: `${__dirname}/certs/mongo.pem`,
	useNewUrlParser: true,
	useUnifiedTopology: true
	
}).then(() => {
	console.log('connected to db');
}).catch((error) => {
	console.log('problem found', error);
});

const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));

getBuildingNames();
async function getBuildingNames(){
Building.find({}, "name", (err, allBuildings) =>{
	if (err) return handleError(err);

	console.log(allBuildings);
	
});
//db.close
}

//getBuilding();
async function getBuilding(){
	Building.find({name: "Maglott"}, "dryers washers" , (err, buildingMachines) =>{
		if (err) return handleError(err);
		
		json_data = JSON.stringify(buildingMachines);

		json_parse = JSON.parse(json_data)

		console.log(json_parse[0].washers);
		

	});
	
}



//used with old testdb
/*getWashers();
async function getWashers(){
	Machine.find({type: "Washer"}, "state", (err, allWasher) =>{
		if (err) return handleError(err);
		console.log(allWasher);
	});
	
}
*/


//run();
async function run(){
	//const machine = await Machine.create({state: "On", type: "Washer"});
	//const machine = new Machine({state: "On", type: "Washer"})
	await machine.save();
	console.log(machine);
}
