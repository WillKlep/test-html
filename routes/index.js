var express = require('express');
var router = express.Router();
const Machine = require("../Machine");
const Building = require("../Building");
const mongoose = require("mongoose");

const async = require("async");

/* GET home page. */
router.get("/", function (req, res) {
  res.redirect("/catalog");
});

//updates page with database info
//actions have the "keep-alive" header attatched to them. This might need to be changed
router.post("/action", function(request, response){

  console.log("beginning fetch");
  var action = request.body.action;

  //if we need a username/password for the url, those should be securely stored
  //(maybe as environment variables)
  if(action == 'fetch'){
    
    respone.sendStatus(200)
    Building.find({name: "Maglott"}, "dryers washers" , (err, buildingMachines) =>{
      if (err) return handleError(err);
      
      json_data = JSON.stringify(buildingMachines);
  
      json_parse = JSON.parse(json_data)

      console.log(buildingMachines)
      response.json({
        data:buildingMachines
      })

      //console.log(json_parse[0].washers);
      
  
    });




    /*Machine.find({type: "Washer"}, "state", (err, allMachines) =>{
      if (err) return handleError(err);

      response.json({
        data:allMachines
      })
      
      

    });
      db.close
*/

  }

});

module.exports = router;
