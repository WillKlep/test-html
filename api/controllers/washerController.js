//Display states of all Washers
const Machine = require("../Machine");
const Building = require("../Building");

const async = require("async");

exports.index = (req, res) => {
    res.render("index", {title: "home page", message: "NOT IMPLEMENTED: Site Home Page"});
  };

exports.washer_list = function (req, res) {
	//this line will render the laundry page without mongodb. this should be
	//commented back after mongodb is switched to https
    res.render("laundry_page",  { title: "Laundry Page"})
    
    //this could be a secuirty problem. Add a user with read only permission
    //to the database, setup a password, and store the connect string in a
    //separate and protected file.
    
    Building.find({}, "name", (err, allBuildings) =>{
		if (err) return handleError(err);
	    
	    //IMPORTANT TEMP FIX
	    //uncomment this line to return website to how it was originally functioning
        
	/* res.render("laundry_page",  { title: "Laundry Page",
        all_buildings: allBuildings
        });
	
        
	});
    */
};
