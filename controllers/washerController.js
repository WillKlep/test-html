//Display states of all Washers
const Machine = require("../Machine");
const mongoose = require("mongoose");

const async = require("async");

exports.index = (req, res) => {
    res.render("index", {title: "home page", message: "NOT IMPLEMENTED: Site Home Page"});
  };

exports.washer_list = function (req, res) {
    res.render("laundry_page",  { title: "Laundry Page"})
    
    //this could be a secuirty problem. Add a user with read only permission
    //to the database, setup a password, and store the connect string in a
    //separate and protected file.
    /*
    
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
    
    Machine.find({type: "Washer"}, "state", (err, allMachines) =>{
		if (err) return handleError(err);

        res.render("laundry_page",  { title: "Laundry Page",
        all_machines: allMachines
        });
        
	});
    db.close
    */
};