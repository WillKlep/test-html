var express = require('express');
var router = express.Router();
var webpush = require('web-push');
//could be a security concern. Revisit how to securley store strings
webpush.setVapidDetails(
  'mailto:example@intellaundry.com',
  'BL1J9HR5Oe-TcJW6Fd93h5NcUKRLDjUAEDHmu9G-cBC15lG098bgQ65dJz0tCHkiWSXdYTlzcs0CchzZCMAG8Fs',
  'l8SPllBl5sYWhRRg3UwauDS0BkMGGg7PmoJqeq3l12c'
)

const Machine = require("../Machine");
const MachineSubscriber = require("../MachineSubscriber");
const Building = require("../Building");
const mongoose = require("mongoose");

const async = require("async");

/* GET home page. */
router.get("/", function (req, res) {
  res.sendFile('../../app/dist/laundry/index.html', { root: __dirname });
});

//updates page with database info
//actions have the "keep-alive" header attatched to them. This might need to be changed
router.post("/action", function(request, response){

  console.log("beginning fetch");
  var selectedName = request.body.buildingName;
  console.log(selectedName)

  //if we need a username/password for the url, those should be securely stored
  //(maybe as environment variables)
  

    Building.find({name: selectedName}, "dryers washers" , (err, buildingMachines) =>{
      if (err) return handleError(err);
      
      json_data = JSON.stringify(buildingMachines);
      json_parse = JSON.parse(json_data)
      
      //console.log(buildingMachines[0])


      response.json(buildingMachines[0])

      //console.log(json_parse[0].washers);
      
  
    });


});

//updates page with database info
//actions have the "keep-alive" header attatched to them. This might need to be changed
router.get("/getBuilding", function(request, response){

  console.log("beginning fetch");

  //if we need a username/password for the url, those should be securely stored
  //(maybe as environment variables)
  

    Building.find({}, "name" , (err, buildingNames) =>{
      if (err) return handleError(err);
      
      
      //console.log(buildingNames)


      response.json(buildingNames)

      //console.log(json_parse[0].washers);
      
  
    });


});

//stores the subscriber in the database to be used later
//general subscription plan:
//1. user clicks angular table button, generating a subscription object
//  -might be good to disable button after this, to prevent bulk notifications being sent
//  -might be good to ensure the user can only subscribe ONCE
//2. the subscription object AND an machine identifier (maybe id?) is posted to the server
//3. subscription object is stored in the database with the machine ID
//4. somewhere else in another route (maybe in the getESPdata), each time the database is updated,
//   a check is done to see if the current machine's state changes from on to off.
//5. when this change is detected, get all subscription objects that correlate with the machine's id,
//   and begin sending them notifications
//6. Afterwards, delete these notifications from the database

// security to consider: a unique token may need to be stored with the subscription objects
// to prevent third parties from requesting and sending notifications.
// Database storing MUST be secured with a username/password.
router.post("/storeSubscriber", async function(request, response){

let machineID = request.body.id;
  //this needs to be stored in a database. When the event occurs (on to off or whatever), obtain all people who
  //want notifications and send it to them. Afterwards, delete from database

  //right now sub is immediatly taken and the push is sent
let sub = request.body.sub;

//store machineID and subscriber in db
MachineSubscriber.insertMany({machineid: machineID, subObj: sub})


//the sub object and the message could both be stored in the db. Or, the sub object is stored
//with a reference to the washer/dryer by ID.
let payload = JSON.stringify({
"notification": {
"title": "test",
"body": "this is the body. machineID= " + machineID
}
})

//send the notification using the subscriber object and the payload
Promise.resolve(webpush.sendNotification(sub, payload)).then(() => response.status(200).json({
message: "Notification sent"
})).catch(err => {
  console.error(err);
  response.sendStatus(500);
})



})

router.post("/removeSubscriber", async function(request, response){


//obtain the machineID and the subObj
let machineID = request.body.id;
  
let sub = request.body.sub;

//delete the subscription from the collection based on the subscription object and machine ID
MachineSubscriber.deleteOne({subObj: sub, machineid: machineID}, (err, foundDoc) =>{
  if (err) console.log(err)
});


response.sendStatus(200);

})



module.exports = router;
