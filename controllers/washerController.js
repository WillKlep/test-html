//Display states of all Washers
const Machine = require("../Machine");
const Building = require("../Building");

const async = require("async");

exports.index = (req, res) => {
    res.render("index", {title: "home page", message: "AS OF 2-15-23: NOT IMPLEMENTED: Site Home Page"});
  };

exports.washer_list = function (req, res) {
    //res.render("laundry_page",  { title: "Laundry Page"})
    
    //this could be a secuirty problem. Add a user with read only permission
    //to the database, setup a password, and store the connect string in a
    //separate and protected file.
    
    Building.find({}, "name", (err, allBuildings) =>{
		if (err) return handleError(err);

        res.render("laundry_page",  { title: "Laundry Page",
        all_buildings: allBuildings
        });
        
	});
    
};