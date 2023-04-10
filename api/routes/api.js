var express = require('express');
var router = express.Router();
var webpush = require('web-push');
var sanitize = require('mongo-sanitize');


webpush.setVapidDetails(
  process.env.VAPID_MAILTO,
  process.env.VAPID_PUBLIC,
  process.env.VAPID_PRIVATE
)

const Machine = require("../Machine");
const MachineSubscriber = require("../MachineSubscriber");
const Building = require("../Building");
const espDataCollect = require("../espDataCollect");

//log the data being obtained by the esp
router.post("/logLaundryData", function(req,res){
  
  //first check if espPswd is correct
  if(req.body.espPswd == process.env.ESP_PSWD){
  
	current = sanitize(req.body.current);
  timestamp = Date.now()
  espID = sanitize(req.body.espID)
  cscID = sanitize(req.body.cscID)
  buildingID = sanitize(req.body.buildingID)
  machineType = sanitize(req.body.machineType)
  countNum = sanitize(req.body.count)
	isActive = false

  espDataJSON = JSON.stringify({
    "count": countNum,
    "current": current,
    "timestamp": timestamp
    })


  //find the existing machine entry
  Machine.find({machineID: cscID}, (err, machineObj) =>{
    if (err) return handleError(err);

    //check if a machine was found, if none were, then this is a new machine
    if(machineObj.length != 0){

      //first determine the state of the machine
    if(machineObj[0].type == "Washer"){
      
      //this is where we would put the code for predicting state
      //isActive = python_predict(current, timestamp)
      //result of algorithm will be true or false


    }
    else if(machineObj[0].type == "Dryer"){
      //if the device is a dryer, a simple if statement can be used to determine state
      if(current > 0){
        isActive = true
      }
      else{
        isActive = false
        console.log(isActive)
      }


    }

    //next, check the state transition
    //machine goes from ON -> OFF, set timestamps and send notifications
    if(machineObj[0].active && !isActive){

      Machine.updateOne({machineID: machineObj[0].machineID}, {$push: {dataArray: espDataJSON}, $set: {active: isActive, UNIXtimeWhenOff: timestamp, UNIXtimeWhenUpdate: timestamp}}, function(err){
        if(err){
                console.log(err);
        }else{
                console.log("Machine" + machineObj[0].machineID + ": ON -> OFF");
        }
      });

      notifyBody = machineObj[0].type + machineObj[0].machineID + " (" + machineObj[0].building.name + ") has just finished"

      sendNotifications(machineObj[0].machineID, "Machine Activity",notifyBody);
        


    }
    //machine goes from OFF -> ON, change state and reset Off timestamp
    else if (!machineObj[0].active && isActive){

      Machine.updateOne({machineID: cscID}, {$push: {dataArray: espDataJSON}, $set: {active: isActive, UNIXtimeWhenOff: 0, UNIXtimeWhenUpdate: timestamp}}, function(err){
        if(err){
                console.log(err);
        }else{
                console.log("Machine" + machineObj[0].machineID + ": OFF -> ON");
        }
      });

    }
    //machine goes from OFF -> OFF, update current time
    else if(!machineObj[0].active && !isActive){
      //current timestamp must be saved server side, since the time and timezones of client machines
      //could be different
      Machine.updateOne({machineID: cscID}, {$push: {dataArray: espDataJSON}, $set: {UNIXtimeWhenUpdate: timestamp}}, function(err){
        if(err){
                console.log(err);
        }else{
                console.log("Machine" + machineObj[0].machineID + ": OFF -> OFF");
        }
      });
    }
    //machine goes from ON -> ON, update current timestamp
    else if (machineObj[0].active && isActive){
      
      Machine.updateOne({machineID: cscID}, {$push: {dataArray: espDataJSON}, $set: {UNIXtimeWhenUpdate: timestamp}}, function(err){
        if(err){
                console.log(err);
        }else{
                console.log("Machine" + machineObj[0].machineID + ": ON -> ON");
        }
      });
    }

    
    res.send({response:"Data Logged"});
  }
  else{
  //if a machine isnt found, then a new entry needs to be created
  //user must provide:
  // -the buildingID that the machine is in
  // -the type of machine that it is
  //this can either be done via console, via esp, or via manual db insertion
  Machine.updateOne({espID: espID}, {$push: {dataArray: espDataJSON}, $set: {active: false, type: machineType, machineID: cscID, buildingID: buildingID, UNIXtimeWhenOff: timestamp, UNIXtimeWhenUpdate: timestamp, UNIXtimeRemaining: 0, errorCodeList:[]}}, {upsert:true}, function(err){
    if(err){
            console.log(err);
    }else{
            console.log(res.send({response:"New Machine Added"}));
    }
  });
  }

  }).populate('building');

  }

})


//log the data being obtained by the esp
router.post("/logESPData", function(req,res){
  //machine_id = req.body.machine_id;
	current = req.body.current;
  timestamp = Date.now()
  espID = req.body.espID
  countNum = req.body.count
  //count = req.body.count;
	
  espDataJSON = JSON.stringify({
    "count": countNum,
    "current": current,
    "timestamp": timestamp
    })

    /*
    finds an esp with a specific ID, used mainly for testing
    espDataCollect.find({uniqueID: espID}, (err, esp) =>{
      if (err) return handleError(err);

      //testJSON = JSON.parse(esp)

      console.log(JSON.parse(esp[0].dataArray[0]).current)
      //testJSON = JSON.stringify(esp.dataArray.get(0))
      //console.log(testJSON.current)
      
      res.json(esp)
  
    });
    */

  espDataCollect.updateMany({uniqueID: espID}, {$push: {dataArray: espDataJSON}, $set: {latestCurrent: current, count: countNum}}, {upsert:true}, function(err){
    if(err){
            console.log(err);
    }else{
            console.log("Successfully added");
    }
  });

  res.send({response:"Data Logged"});

})

//obtain and return all esp objects in the DB
router.get("/getESPData", function(req, res){
  espDataCollect.find({}, "uniqueID latestCurrent count", (err, espList) =>{
    if (err) return handleError(err);
    
    res.json(espList)

  });



})



//updates page with database info
//request holds buildingID, machines holding this value are returned
router.post("/action", function(request, response){

  console.log("beginning fetch");
  var selectedBuildingID = sanitize(request.body.buildingID);
  //console.log(selectedBuildingID)
  

    Machine.find({buildingID: selectedBuildingID}, "UNIXtimeWhenOff UNIXtimeWhenUpdate active buildingID machineID type errorCodeList", (err, buildingMachines) =>{
      if (err) return handleError(err);


      response.json(buildingMachines)
  
    });


});


router.get("/getBuilding", function(request, response){

  console.log("beginning fetch");

  //if we need a username/password for the url, those should be securely stored
  //(maybe as environment variables)
    Building.find({}, "name buildingID" , (err, buildingNames) =>{
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

let machineID = sanitize(request.body.id);
  //this needs to be stored in a database. When the event occurs (on to off or whatever), obtain all people who
  //want notifications and send it to them. Afterwards, delete from database

  //right now sub is immediatly taken and the push is sent
let sub = sanitize(request.body.sub);

//store machineID and subscriber in db
//MachineSubscriber.insertMany({machineid: machineID, subObj: sub})
MachineSubscriber.updateOne({subObj: sub}, {$push: {subbedMachines: machineID}}, {upsert:true}, function(err){
if(err){
  console.log(err);
}else{
  console.log("Successfully added");
}
});


})

//check washer service for description
router.post("/subbedList", async function(request, response){
  let sub = sanitize(request.body.sub);

  MachineSubscriber.find({subObj: sub}, "subbedMachines" , (err, subbedMachinesList) =>{

    //if something is found, use it to obtain the machine list
    if(subbedMachinesList.length != 0){
    Machine.find({machineID: {$in: subbedMachinesList[0].subbedMachines}}, (err, machineList) =>{
      if (err) return handleError(err);
  
  
      response.json(machineList)
  
    });
  }
  else{
    //if nothing is found, return nothing
    response.json([])
  }
  
  


  })

  
  
})


router.post("/removeSubscriber", async function(request, response){


//obtain the machineID and the subObj
let machineID = sanitize(request.body.id);
  
let sub = sanitize(request.body.sub);

//delete the subscription from the collection based on the subscription object and machine ID
/*
MachineSubscriber.deleteOne({subObj: sub, machineid: machineID}, (err, foundDoc) =>{
  if (err) console.log(err)
});
*/

//look for sub object in db that matches, then remove the machineID from the list
MachineSubscriber.updateOne({subObj: sub}, {$pull:{subbedMachines: machineID}}, {upsert:true}, function(err){
  if(err){
    console.log(err);
  }else{  
    console.log("Successfully removed subbed machine");
    
    //get the subbed machine list after removal
    MachineSubscriber.find({subObj: sub}, "subbedMachines" , (err, subbedMachinesList) =>{
      
      //check if list is empty, if it is, delete document
      if(subbedMachinesList[0].subbedMachines.length == 0){
        MachineSubscriber.deleteOne({subObj: sub, machineid: machineID}, (err, foundDoc) =>{
          if (err) console.log(err)
        });
      }
    });
  }
  });



response.sendStatus(200);
})

//initiates timeoutCheck, which determines if a machine has not received a ping in +2 minutes
//interval is 3 minutes
//error code = NO_UPDATES
const timeoutCheck = setInterval(function() {
  console.log("Checking connection of all machines...")
  currentTime = Date.now()
  errorCode = "NO_UPDATES"
  
  //obtain all machines, iterate through and check if each machine hasn't been updated in 3 minutes
  Machine.find({}, (err, allMachines) =>{
    if (err) return handleError(err);

    if(allMachines.length != 0){
      for(let i = 0; i < allMachines.length; i++){

        //if a machine hasn't gotten an update in the last 2 minutes, and they dont have the errorcode, add it to list
        //also, send error notifications to all users who are watching the machine
        if((Math.trunc((currentTime - allMachines[i].UNIXtimeWhenUpdate)/1000/60) > 2) && !allMachines[i].errorCodeList.includes(errorCode)){
          
          Machine.updateOne({machineID : allMachines[i].machineID}, {$push: {errorCodeList: errorCode}}, function(err){
            if(err){
              console.log(err);
            }else{

              notifyBody = allMachines[0].type + " " + allMachines[0].machineID + " (" + allMachines[0].building.name +") has lost connection and is no longer updating"

              sendNotifications(allMachines[0].machineID, "Machine Lost Connection",notifyBody);

              console.log("Machine " + allMachines[i].machineID +" Lost Connection")}})

        }
        //if a machine has gotten an update in the last 3 minutes and has the errorcode, remove it from list
        else if((Math.trunc((currentTime - allMachines[i].UNIXtimeWhenUpdate)/1000/60) < 2) && allMachines[i].errorCodeList.includes(errorCode)){
          Machine.updateOne({machineID : allMachines[i].machineID}, {$pull: {errorCodeList: errorCode}}, function(err){
            if(err){
              console.log(err);
            }else{  
              console.log("Machine " + allMachines[i].machineID +" Restored Connection")}})
        }

      }
    }



  }).populate('building');

}, 180000);

//sends notifications to all subscribers monitoring the machine with the given ID
function sendNotifications(machineID, notifyTitle, notifyBody){
//obtain all subObjs that are monitoring the machine
MachineSubscriber.find({subbedMachines: machineID}, "subObj", function(err, subList){
  if(err){
    console.log(err);
  }else{
    console.log("Successfully obtained subList");
  }
  console.log(subList)
  
  //create notification payload
  let payload = JSON.stringify({
    "notification": {
    "title": notifyTitle,
    "body": notifyBody
    }
    })
    
    //send payload to all subObjs
    for(let i = 0; i < subList.length; i++){
      //send the notification using the subscriber object and the payload
    Promise.resolve(webpush.sendNotification(subList[i].subObj, payload))
    }

    //remove machine ID from all subbedMachine lists that contain it
      MachineSubscriber.updateMany({subbedMachines: machineID}, {$pull:{subbedMachines: machineID}}, function(err){
        if(err){
          console.log(err);
        }else{  
          console.log("Successfully removed subbed machine from all lists");
        
        }
      });

      //delete any subs that have nothing remaining in the subbedMachines list
      MachineSubscriber.deleteMany({subbedMachines: []}, (err) =>{
            if (err) console.log(err)
            });

});


}





module.exports = router;
