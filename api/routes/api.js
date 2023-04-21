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

//at what current level is the machine considered running
const DRYER_ACTIVE_THRESHOLD = 1
const WASHER_ACTIVE_THRESHOLD = 1

//cycle current ranges
const WASH_CURRENT_MIN = 9
const WASH_CURRENT_MAX = 15

const RINSE_CURRENT_MIN = 7
const RINSE_CURRENT_MAX = 8

const SPIN_CURRENT_MIN = 7
const SPIN_CURRENT_MAX = 8

//the start times of each cycle instance
const RINSE_TIME_ELAPSED = [10, 22]
const SPIN_TIME_ELAPSED = [13, 25]

function determineWashCycle(current, timeWhenOn, currentTime, isActive){

  timeElapsed = (currentTime - timeWhenOn)/1000/60


  //if washer isnt active, then its off
  if(!isActive){
    return "Off"
  }
  //if current falls within rinse range, and also falls within the minute ranges for rinse
  else if(current >= RINSE_CURRENT_MIN && current <= RINSE_CURRENT_MAX && (timeElapsed >= RINSE_TIME_ELAPSED[0] && timeElapsed < SPIN_TIME_ELAPSED[0] || timeElapsed >= RINSE_TIME_ELAPSED[1] && timeElapsed < SPIN_TIME_ELAPSED[1])){
	  return "Rinse Cycle"
	}
  //if current falls within spin range, and also falls within the minute ranges for spin
	else if(current >= SPIN_CURRENT_MIN && current <= SPIN_CURRENT_MAX && (timeElapsed >= SPIN_TIME_ELAPSED[0] && timeElapsed < RINSE_TIME_ELAPSED[1] || timeElapsed >= SPIN_TIME_ELAPSED[1])){
	  return "Spin Cycle"
	}
  //if none of the above conditions are met, then check if the current is above the wash cycle minimum
	else if(current >= WASH_CURRENT_MIN){
		return "Wash Cycle"
	}
	else{
    //defaults to On if none of the above conditions are met
		return "On"
	}


}


//checks the state of the washer, assuming it is currently on in the db
function checkWasherState(current, timeWhenOff, currentTime){

  //if the current is below threshold, that does not mean its done
  //check timeout period
  if(current < WASHER_ACTIVE_THRESHOLD){

    //if the washer has been off for more than 5 mins, then it is off
  if(currentTime/1000/60-timeWhenOff/1000/60 > .5){
    return false
  }
  else{
    //if the washer has been off for less than 5 mins, it could be filling water, return true
    return true
  }
  }
  else{
  //the current is higher than the threshold, return true
  return true
  }

}

//log the data being obtained by the esp
router.post("/logLaundryData", function(req,res){
  
  //first check if espPswd is correct
  if(req.body.espPswd == process.env.ESP_PSWD){
  
	current = sanitize(req.body.current);
  timestamp = Date.now()
  espID = sanitize(req.body.espID)
  cscID = sanitize(req.body.cscID)
  ESPbuildingName = sanitize(req.body.buildingName)
  machineType = sanitize(req.body.machineType)
  countNum = sanitize(req.body.count)
	isActive = false
  determinedCycle = "UNSET"

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


    //first determine the type of the machine
    if(machineObj[0].type == "Washer"){



      //if the washer is going from ON to OFF AND its timeWhenOff is currently below threshold, check the washerState by passing in
      //the current timestamp as timeWhenOff
      if(current < WASHER_ACTIVE_THRESHOLD && machineObj[0].active && machineObj[0].UNIXtimeWhenOff == 0){
      isActive = checkWasherState(current, timestamp, timestamp)
      }
      else{
      //otherwise, use existing timeWhenOff timestamp
      isActive = checkWasherState(current, machineObj[0].UNIXtimeWhenOff, timestamp)
      }

      //since washer has been determined to be active, rough guess the cycle
      //if the washer is going from OFF -> ON, use timestamp in place of timeWhenOn, since that has not updated yet
      if(isActive && machineObj[0].UNIXtimeWhenOn == 0){
        determinedCycle = determineWashCycle(current, timestamp, timestamp, isActive)
      }
      else{
        determinedCycle = determineWashCycle(current, machineObj[0].UNIXtimeWhenOn, timestamp, isActive)
      }


    }
    else if(machineObj[0].type == "Dryer"){
      //if the device is a dryer, a simple if statement can be used to determine state
      if(current >= DRYER_ACTIVE_THRESHOLD){
        isActive = true
        determinedCycle = "On"
      }
      else{
        isActive = false
        determinedCycle = "Off"
      }


    }

    //next, check the state transition
    //machine goes from ON -> OFF, set state, cycle, timestamps, and send notifications
    if(machineObj[0].active && !isActive){

      //if the machine is a washer, then UNIXtimeWhenOff should NOT be set, since it is already set during state ON -> ON for checking delay
      if(machineObj[0].type == "Washer"){
      Machine.updateOne({machineID: machineObj[0].machineID}, {$push: {dataArray: espDataJSON}, $set: {active: isActive, cycle: determinedCycle, UNIXtimeWhenOn: 0, UNIXtimeWhenUpdate: timestamp}}, function(err){
        if(err){
                console.log(err);
        }else{
                console.log("Machine" + machineObj[0].machineID + ": ON -> OFF");
        }
      });
    }
    else{

      Machine.updateOne({machineID: machineObj[0].machineID}, {$push: {dataArray: espDataJSON}, $set: {active: isActive, cycle: determinedCycle, UNIXtimeWhenOff: timestamp, UNIXtimeWhenOn: 0, UNIXtimeWhenUpdate: timestamp}}, function(err){
        if(err){
                console.log(err);
        }else{
                console.log("Machine" + machineObj[0].machineID + ": ON -> OFF");
        }
      });
    }


      notifyBody = machineObj[0].type + " " + machineObj[0].machineID + " (" + machineObj[0].building.name + ") has just finished"

      sendNotifications(machineObj[0].machineID, "Machine Activity",notifyBody);
        


    }
    //machine goes from OFF -> ON, change state, cycle,  and set timestamps
    else if (!machineObj[0].active && isActive){

      Machine.updateOne({machineID: cscID}, {$push: {dataArray: espDataJSON}, $set: {active: isActive, cycle: determinedCycle, UNIXtimeWhenOff: 0, UNIXtimeWhenOn: timestamp, UNIXtimeWhenUpdate: timestamp}}, function(err){
        if(err){
                console.log(err);
        }else{
                console.log("Machine" + machineObj[0].machineID + ": OFF -> ON");
        }
      });

    }
    //machine goes from OFF -> OFF, update current time and cycle
    else if(!machineObj[0].active && !isActive){

      Machine.updateOne({machineID: cscID}, {$push: {dataArray: espDataJSON}, $set: {cycle: determinedCycle, UNIXtimeWhenUpdate: timestamp}}, function(err){
        if(err){
                console.log(err);
        }else{
                console.log("Machine" + machineObj[0].machineID + ": OFF -> OFF");
        }
      });
    }
    //machine goes from ON -> ON, update current timestamp and predicted cycle
    else if (machineObj[0].active && isActive){
      
      //if the current is < threshold, but it has been determined that the machine is still on, update UNIXtimeWhenOff as well
      if(current < WASHER_ACTIVE_THRESHOLD && machineObj[0].UNIXtimeWhenOff == 0){
        Machine.updateOne({machineID: cscID}, {$push: {dataArray: espDataJSON}, $set: {cycle: determinedCycle, UNIXtimeWhenOff: timestamp, UNIXtimeWhenUpdate: timestamp}}, function(err){
          if(err){
                  console.log(err);
          }else{
                  console.log("Machine" + machineObj[0].machineID + ": ON -> ON");
          }
        });

    }
    else{
      Machine.updateOne({machineID: cscID}, {$push: {dataArray: espDataJSON}, $set: {cycle: determinedCycle, UNIXtimeWhenUpdate: timestamp}}, function(err){
        if(err){
                console.log(err);
        }else{
                console.log("Machine" + machineObj[0].machineID + ": ON -> ON");
        }
      });
    }

    }

    
    res.send({response:"Data Logged"});
  }
  else{
  //if a machine isnt found, then a new entry needs to be created
  //user must provide:
  // -the buildingName that the machine is in
  // -the type of machine that it is
  // -the MAC address of the ESP (or unique indicator of device)
  //manual data is sent from ESP
  Building.find( (err, allBuildings) => {
    if(err){
      console.log("error finding all buildings");
    }else{

      let foundBuilding = false
      let foundBuildingID = -1
      
      //if a building received name wasn't found, create a new building
      for(let i = 0; i < allBuildings.length; i++){
        console.log(allBuildings[i].name)
        if(allBuildings[i].name == ESPbuildingName){
          foundBuilding = true

          foundBuildingID = allBuildings[i].buildingID
          
        }
      }

      if(!foundBuilding){
        
        Building.updateOne({buildingID: foundBuildingID}, { $set: {name: ESPbuildingName, buildingID : allBuildings.length+1}}, {upsert:true}, function(err){
          if(err){
            console.log("error inserting building");
          }
        })

        foundBuildingID = allBuildings.length+1
        
      }

      //add machine to db
      Machine.updateOne({machineID: cscID}, {$push: {dataArray: espDataJSON}, $set: {
        active: false,
        cycle: "UNSET",
        type: machineType,
        machineID: cscID,
        espID: espID,
        buildingID: foundBuildingID,
        UNIXtimeWhenOff: timestamp,
        UNIXtimeWhenUpdate: timestamp,
        UNIXtimeWhenOn: 0,
        errorCodeList:[]}}, {upsert:true}, function(err){
        if(err){
                console.log("error inserting machine");
        }else{
                console.log(res.send({response:"New Machine Added"}));
        }
      });

      

    }


  })
  
  
  
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
  

    Machine.find({buildingID: selectedBuildingID}, "UNIXtimeWhenOff UNIXtimeWhenUpdate UNIXtimeWhenOn cycle active buildingID machineID type errorCodeList", (err, buildingMachines) =>{
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

let machineIDList = sanitize(request.body.id);
  //this needs to be stored in a database. When the event occurs (on to off or whatever), obtain all people who
  //want notifications and send it to them. Afterwards, delete from database

  //right now sub is immediatly taken and the push is sent
let sub = sanitize(request.body.sub);

//store machineID and subscriber in db
//MachineSubscriber.insertMany({machineid: machineID, subObj: sub})
MachineSubscriber.updateOne({subObj: sub}, {$push: {subbedMachines: machineIDList}}, {upsert:true}, function(err){
if(err){
  console.log(err);
}else{
  console.log("Successfully added");
  response.sendStatus(200)
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
let machineIDList = sanitize(request.body.id);
  
let sub = sanitize(request.body.sub);

//delete the subscription from the collection based on the subscription object and machine ID
/*
MachineSubscriber.deleteOne({subObj: sub, machineid: machineID}, (err, foundDoc) =>{
  if (err) console.log(err)
});
*/

//look for sub object in db that matches, then remove the machineID from the list
MachineSubscriber.updateOne({subObj: sub}, {$pull:{subbedMachines: {$in: machineIDList}}}, {upsert:true}, function(err){
  if(err){
    console.log(err);
  }else{  
    console.log("Successfully removed subbed machine");
    
    //get the subbed machine list after removal
    MachineSubscriber.find({subObj: sub}, "subbedMachines" , (err, subbedMachinesList) =>{
      
      //check if list is empty, if it is, delete document
      if(subbedMachinesList[0].subbedMachines.length == 0){
        MachineSubscriber.deleteOne({subObj: sub, machineid: machineIDList}, (err, foundDoc) =>{
          if (err) console.log(err)
        });
      }
    });
  }
  });



response.sendStatus(200);
})

//initiates timeoutCheck, which determines if a machine has not received a ping in +3 minutes
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

        //if a machine hasn't gotten an update in the last 3 minutes, and they dont have the errorcode, add it to list
        //also, send error notifications to all users who are watching the machine
        if((Math.trunc((currentTime - allMachines[i].UNIXtimeWhenUpdate)/1000/60) > 3) && !allMachines[i].errorCodeList.includes(errorCode)){
          
          Machine.updateOne({machineID : allMachines[i].machineID}, {$push: {errorCodeList: errorCode}}, function(err){
            if(err){
              console.log(err);
            }else{

              notifyBody = allMachines[i].type + " " + allMachines[i].machineID + " (" + allMachines[i].building.name +") has lost connection and is no longer updating"

              sendNotifications(allMachines[i].machineID, "Machine Lost Connection",notifyBody);

              console.log("Machine " + allMachines[i].machineID +" Lost Connection")}})

        }
        //if a machine has gotten an update in the last 3 minutes and has the errorcode, remove it from list
        else if((Math.trunc((currentTime - allMachines[i].UNIXtimeWhenUpdate)/1000/60) < 3) && allMachines[i].errorCodeList.includes(errorCode)){
          Machine.updateOne({machineID : allMachines[i].machineID}, {$pull: {errorCodeList: errorCode}}, function(err){
            if(err){
              console.log(err);
            }else{  
              console.log("Machine " + allMachines[i].machineID +" Restored Connection")}})
        }

      }
    }



  }).populate('building');

}, 5000);

//sends notifications to all subscribers monitoring the machine with the given ID
function sendNotifications(machineID, notifyTitle, notifyBody){
//obtain all subObjs that are monitoring the machine
MachineSubscriber.find({subbedMachines: machineID}, "subObj", function(err, subList){
  if(err){
    console.log(err);
  }else{
    console.log("Successfully obtained subList");
    console.log(subList)
  }
  
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
      //catches any notifications with expired endpoints.
    Promise.resolve(webpush.sendNotification(subList[i].subObj, payload)).catch((error) => {
      console.log(error)})

    }

    //remove machine ID from all subbedMachine lists that contain it
      MachineSubscriber.updateMany({subbedMachines: machineID}, {$pull:{subbedMachines: machineID}}, function(err){
        if(err){
          console.log(err);
        }else{  
          console.log("Successfully removed subbed machine from all lists");



          //delete any subs that have nothing remaining in the subbedMachines list
        MachineSubscriber.deleteMany({subbedMachines: []}, (err) =>{
        if (err) console.log(err)
        });


        }
      });

});


}





module.exports = router;