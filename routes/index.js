var express = require('express');
var router = express.Router();
const Machine = require("../Machine");
const mongoose = require("mongoose");

const async = require("async");

/* GET home page. */
router.get("/", function (req, res) {
  res.redirect("/catalog");
});

//updates page with database info
router.post("/action", function(request, response){

  console.log("beginning fetch");
  var action = request.body.action;

  //if we need a username/password for the url, those should be securely stored
  //(maybe as environment variables)
  if(action == 'fetch'){

    mongoose.connect("mongodb://127.0.0.1:27017/testdb",
{
	useNewUrlParser: true,
	useUnifiedTopology: true
	
}).then(() => {
	console.log('connected to db');
  const db = mongoose.connection;

  db.on("error", console.error.bind(console, "MongoDB connection error:"));
      
      Machine.find({type: "Washer"}, "state", (err, allMachines) =>{
      if (err) return handleError(err);

      response.json({
        data:allMachines
      })
      
      

    });
      db.close

}).catch((error) => {
	console.log('problem found', error);
});

  //console.log(allMachines);


  }

});

module.exports = router;
