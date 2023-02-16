$(document).ready(function() {
	//$("h1").on("load",function(event) {
		//event.preventDefault();
		//used to initially load the table
	    load_data();

	    var run_update = setInterval(load_data, 10000);

	    function load_data() {
			$.ajax({
				url: "/data",
				method: "GET",
				contentType: "application/json",
				data:{action: 'fetch'},
				sucess: function(res){
					console.log(res.machine_id);
					
					document.getElementById("Datamachine_id").innerHTML = res.res.machine_id;
					document.getElementById("Datacurrent").innerHTML = res.res.current;
					document.getElementById("Datacount").innerHTML = res.res.count;
					
					
					//old method
					//$("h1").html(`Quote: ${res.response}`);
				},
				error: function(jqXHR, textStatus, errorThrown){
        				console.log('ERROR: ' + jqXHR.status);
    				}
			}) // close ajax
		} // close load_data
	//});// close load
}); // close document.ready
