$(document).ready(function() {
	//$("h1").on("load",function(event) {
		//event.preventDefault();
		//used to initially load the table
	    load_data();

	    var run_update = setInterval(load_data, 10000);

	    function load_data() {
			$.ajax({
				url: "/ESPdata",
				method: "GET",
				dataType: "JSON",
				data:{action: 'fetch'},
				sucess: function(res){
					console.log("json success");
					
					document.getElementById('Datamachine_id').innerHTML = res.data.machine_id;
					document.getElementById('Datacurrent').innerHTML = 4
					document.getElementById('DataCount').innerHTML = "test";
					
					
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
